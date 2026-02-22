"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { createNotification } from "@/actions/notifications";
import { revalidatePath } from "next/cache";

export async function submitDispute(questionId: string, message: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const trimmed = message.trim();
  if (trimmed.length < 10) throw new Error("Message must be at least 10 characters");
  if (trimmed.length > 1000) throw new Error("Message must be 1000 characters or less");

  const { data: question } = await supabase
    .from("questions")
    .select("status")
    .eq("id", questionId)
    .single();
  if (!question || question.status !== "RESOLVED") throw new Error("Question is not resolved");

  const { data: forecast } = await supabase
    .from("forecasts")
    .select("id")
    .eq("user_id", user.id)
    .eq("question_id", questionId)
    .single();
  if (!forecast) throw new Error("You have no forecast on this question");

  const { data: existing } = await supabase
    .from("resolution_disputes")
    .select("id")
    .eq("user_id", user.id)
    .eq("question_id", questionId)
    .single();
  if (existing) throw new Error("You have already submitted a dispute for this question");

  const { error } = await supabase.from("resolution_disputes").insert({
    user_id: user.id,
    question_id: questionId,
    message: trimmed,
  });
  if (error) throw new Error("Failed to submit dispute");

  revalidatePath(`/questions/${questionId}`);
  return { success: true };
}

export async function reviewDispute(disputeId: string, status: "REVIEWED" | "DISMISSED", adminNote?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") throw new Error("Not authorized");

  const admin = await createAdminClient();

  const { data: dispute } = await admin
    .from("resolution_disputes")
    .select("user_id, question_id")
    .eq("id", disputeId)
    .single();
  if (!dispute) throw new Error("Dispute not found");

  await admin.from("resolution_disputes").update({
    status,
    admin_note: adminNote || null,
  }).eq("id", disputeId);

  const statusLabel = status === "REVIEWED" ? "acknowledged" : "dismissed";
  await createNotification(
    dispute.user_id,
    "dispute_response",
    `Your dispute was ${statusLabel}`,
    adminNote || `Your dispute has been ${statusLabel}.`,
    `/questions/${dispute.question_id}`
  );

  revalidatePath("/admin/disputes");
  return { success: true };
}
