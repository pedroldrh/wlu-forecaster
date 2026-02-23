"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/send-push";

export async function createNotification(
  userId: string,
  type: "resolution" | "new_question" | "dispute_response",
  title: string,
  body: string,
  link?: string
) {
  const admin = await createAdminClient();
  const { error } = await admin.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body,
    link: link ?? null,
  });
  if (error) console.error("Failed to create notification:", error.message);

  // Fire-and-forget push notification
  sendPushToUser(userId, { title, body, link, tag: type }).catch(() => {});
}

export async function markAllRead() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);
  if (error) throw new Error("Failed to mark notifications as read");
}
