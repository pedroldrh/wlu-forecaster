import { getWebPush } from "@/lib/web-push";
import { createAdminClient } from "@/lib/supabase/server";

interface PushPayload {
  title: string;
  body: string;
  link?: string;
  tag?: string;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const admin = await createAdminClient();
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs || subs.length === 0) return;

  const webPush = getWebPush();
  const results = await Promise.allSettled(
    subs.map((sub) =>
      webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      )
    )
  );

  // Clean up expired subscriptions
  const toDelete: string[] = [];
  results.forEach((result, i) => {
    if (
      result.status === "rejected" &&
      result.reason?.statusCode &&
      (result.reason.statusCode === 410 || result.reason.statusCode === 404)
    ) {
      toDelete.push(subs[i].id);
    }
  });

  if (toDelete.length > 0) {
    await admin.from("push_subscriptions").delete().in("id", toDelete);
  }
}
