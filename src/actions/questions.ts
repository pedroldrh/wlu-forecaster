"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") throw new Error("Admin access required");
  return { user, supabase };
}

type Category = "SPORTS" | "CAMPUS" | "ACADEMICS" | "GREEK" | "OTHER";

export async function createQuestion(data: {
  seasonId: string;
  title: string;
  description: string;
  category: string;
  closeTime: string;
  resolveTime: string;
}) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("questions").insert({
    season_id: data.seasonId,
    title: data.title,
    description: data.description,
    category: data.category as Category,
    close_time: data.closeTime,
    resolve_time: data.resolveTime,
    status: "OPEN",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/questions");
  revalidatePath("/questions");
}

export async function updateQuestion(id: string, data: {
  title?: string;
  description?: string;
  category?: string;
  closeTime?: string;
  resolveTime?: string;
}) {
  const { supabase } = await requireAdmin();
  const updateData: Record<string, any> = {};
  if (data.title) updateData.title = data.title;
  if (data.description) updateData.description = data.description;
  if (data.category) updateData.category = data.category;
  if (data.closeTime) updateData.close_time = data.closeTime;
  if (data.resolveTime) updateData.resolve_time = data.resolveTime;

  await supabase.from("questions").update(updateData as any).eq("id", id);
  revalidatePath("/admin/questions");
  revalidatePath("/questions");
}

export async function resolveQuestion(id: string, outcome: boolean) {
  const { supabase } = await requireAdmin();
  const { data: question } = await supabase.from("questions").select("*").eq("id", id).single();
  if (!question) throw new Error("Question not found");
  if (question.status === "RESOLVED") throw new Error("Already resolved");

  await supabase.from("questions").update({
    status: "RESOLVED",
    resolved_outcome: outcome,
    resolved_at: new Date().toISOString(),
  }).eq("id", id);

  revalidatePath("/admin/questions");
  revalidatePath("/questions");
  revalidatePath(`/questions/${id}`);
  revalidatePath("/leaderboard");
  return { success: true };
}
