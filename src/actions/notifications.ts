"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function createNotification(
  userId: string,
  type: "resolution" | "new_question" | "dispute_response",
  title: string,
  body: string,
  link?: string
) {
  const admin = await createAdminClient();
  await admin.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body,
    link: link ?? null,
  });
}

export async function markAllRead() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);
}
