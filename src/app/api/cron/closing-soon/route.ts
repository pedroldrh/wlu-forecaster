import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getWebPush } from "@/lib/web-push";

function adminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = adminClient();
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  // Find markets closing in the next 24-25 hours (so this runs once per market)
  const { data: closingQuestions } = await supabase
    .from("questions")
    .select("id, title, season_id")
    .eq("status", "OPEN")
    .gte("close_time", in24h.toISOString())
    .lt("close_time", in25h.toISOString());

  if (!closingQuestions || closingQuestions.length === 0) {
    return NextResponse.json({ message: "No markets closing in ~24h" });
  }

  // For each closing market, find users who have NOT voted on it but are in the season
  const wp = getWebPush();
  let totalSent = 0;
  const toDelete: string[] = [];

  for (const q of closingQuestions) {
    // Get users in this season
    const { data: entries } = await supabase
      .from("season_entries")
      .select("user_id")
      .eq("season_id", q.season_id)
      .in("status", ["PAID", "JOINED"]);

    if (!entries || entries.length === 0) continue;

    // Get users who already forecasted on this question
    const { data: forecasts } = await supabase
      .from("forecasts")
      .select("user_id")
      .eq("question_id", q.id);

    const forecastedUsers = new Set((forecasts ?? []).map((f) => f.user_id));
    const usersToNotify = entries
      .map((e) => e.user_id)
      .filter((uid) => !forecastedUsers.has(uid));

    if (usersToNotify.length === 0) continue;

    // Get push subscriptions for these users
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("user_id, endpoint, p256dh, auth")
      .in("user_id", usersToNotify);

    if (!subs || subs.length === 0) continue;

    // Also create in-app notifications
    const notifications = usersToNotify.map((uid) => ({
      user_id: uid,
      type: "new_question" as const,
      title: "Market closing soon!",
      body: `"${q.title}" closes in 24 hours. Make your forecast before it's too late!`,
      link: `/questions/${q.id}`,
    }));
    await supabase.from("notifications").insert(notifications);

    // Send push
    await Promise.allSettled(
      subs.map(async (sub) => {
        const payload = JSON.stringify({
          title: "Market closing soon!",
          body: `"${q.title}" closes in 24h — don't miss it!`,
          link: `/questions/${q.id}`,
          tag: `closing_${q.id}`,
        });

        try {
          await wp.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          totalSent++;
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number })?.statusCode;
          if (statusCode === 410 || statusCode === 404) {
            toDelete.push(sub.endpoint);
          }
        }
      })
    );
  }

  if (toDelete.length > 0) {
    await supabase.from("push_subscriptions").delete().in("endpoint", toDelete);
  }

  return NextResponse.json({
    markets: closingQuestions.length,
    pushSent: totalSent,
  });
}
