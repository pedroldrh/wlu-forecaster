"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitComment(questionId: string, content: string) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const trimmed = content.trim();
  if (trimmed.length === 0) throw new Error("Comment cannot be empty");
  if (trimmed.length > 500) throw new Error("Comment must be 500 characters or less");

  const supabase = await createAdminClient();
  const { error } = await supabase.from("comments").insert({
    question_id: questionId,
    user_id: user.id,
    content: trimmed,
  });

  if (error) throw new Error("Failed to post comment");

  revalidatePath(`/questions/${questionId}`);
  return { success: true };
}

export async function deleteComment(commentId: string, questionId: string) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) throw new Error("Failed to delete comment");

  revalidatePath(`/questions/${questionId}`);
  return { success: true };
}
