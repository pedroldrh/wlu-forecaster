"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitForecast(questionId: string, probability: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (probability < 0 || probability > 1) throw new Error("Probability must be between 0 and 1");

  // Check question is open
  const { data: question } = await supabase.from("questions").select("*").eq("id", questionId).single();
  if (!question) throw new Error("Question not found");
  if (question.status !== "OPEN") throw new Error("Question is not open");
  if (new Date() > new Date(question.close_time)) throw new Error("Question has closed");

  // Auto-join season if not already joined
  const { data: entry } = await supabase
    .from("season_entries")
    .select("*")
    .eq("user_id", user.id)
    .eq("season_id", question.season_id)
    .single();

  if (!entry) {
    await supabase.from("season_entries").insert({
      user_id: user.id,
      season_id: question.season_id,
      status: "JOINED",
    });
  } else if (entry.status === "PENDING") {
    await supabase
      .from("season_entries")
      .update({ status: "JOINED" })
      .eq("user_id", user.id)
      .eq("season_id", question.season_id);
  }

  // Upsert forecast
  const { data: existing } = await supabase
    .from("forecasts")
    .select("id")
    .eq("user_id", user.id)
    .eq("question_id", questionId)
    .single();

  if (existing) {
    await supabase
      .from("forecasts")
      .update({ probability, submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await supabase.from("forecasts").insert({
      user_id: user.id,
      question_id: questionId,
      probability,
    });
  }

  revalidatePath(`/questions/${questionId}`);
  revalidatePath("/questions");
  revalidatePath("/leaderboard");
  return { success: true };
}
