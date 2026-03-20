import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getWebPush } from "@/lib/web-push";

const MIN_FORECASTS = 5;

function adminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function GET(request: Request) {
  // Verify cron secret (Vercel sets this header automatically for cron jobs)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = adminClient();

  // Get the live season
  const { data: season } = await supabase
    .from("seasons")
    .select("id")
    .eq("status", "LIVE")
    .single();

  if (!season) {
    return NextResponse.json({ message: "No live season" });
  }

  // Get all joined/paid users for this season
  const { data: entries } = await supabase
    .from("season_entries")
    .select("user_id")
    .eq("season_id", season.id)
    .in("status", ["PAID", "JOINED"]);

  if (!entries || entries.length === 0) {
    return NextResponse.json({ message: "No entries" });
  }

  // Get all questions in this season (any status — they all count toward total)
  const { data: questions } = await supabase
    .from("questions")
    .select("id")
    .eq("season_id", season.id);

  const questionIds = (questions ?? []).map((q) => q.id);
  if (questionIds.length === 0) {
    return NextResponse.json({ message: "No questions" });
  }

  // Get all forecasts for these questions
  const { data: forecasts } = await supabase
    .from("forecasts")
    .select("user_id, question_id")
    .in("question_id", questionIds);

  // Count distinct questions forecasted per user
  const forecastCountByUser = new Map<string, number>();
  const seen = new Set<string>();
  for (const f of forecasts ?? []) {
    const key = `${f.user_id}:${f.question_id}`;
    if (!seen.has(key)) {
      seen.add(key);
      forecastCountByUser.set(
        f.user_id,
        (forecastCountByUser.get(f.user_id) ?? 0) + 1
      );
    }
  }

  // Count open markets each user hasn't voted on
  const { data: openQuestions } = await supabase
    .from("questions")
    .select("id")
    .eq("season_id", season.id)
    .eq("status", "OPEN")
    .gt("close_time", new Date().toISOString());

  const openIds = (openQuestions ?? []).map((q) => q.id);

  const { data: allForecasts } = await supabase
    .from("forecasts")
    .select("user_id, question_id")
    .in("question_id", openIds);

  const userOpenForecasts = new Map<string, Set<string>>();
  for (const f of allForecasts ?? []) {
    if (!userOpenForecasts.has(f.user_id)) userOpenForecasts.set(f.user_id, new Set());
    userOpenForecasts.get(f.user_id)!.add(f.question_id);
  }

  // Build notification targets: under-5 users get qualification nudge, others get "X markets unvoted" nudge
  const allUserIds = (entries ?? []).map((e) => e.user_id);

  // Get all push subscriptions
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth")
    .in("user_id", allUserIds);

  if (!subs || subs.length === 0) {
    return NextResponse.json({ message: "No push subs" });
  }

  const wp = getWebPush();
  let sent = 0;
  const toDelete: string[] = [];

  await Promise.allSettled(
    subs.map(async (sub) => {
      const totalDone = forecastCountByUser.get(sub.user_id) ?? 0;
      const openVoted = userOpenForecasts.get(sub.user_id)?.size ?? 0;
      const openUnvoted = openIds.length - openVoted;

      let title: string;
      let body: string;

      if (totalDone < MIN_FORECASTS) {
        const remaining = MIN_FORECASTS - totalDone;
        title = "Don't miss out on prizes!";
        body = `You've forecasted on ${totalDone}/5 markets. Predict ${remaining} more to qualify for the prize pool.`;
      } else if (openUnvoted > 0) {
        title = "New markets to predict on";
        body = `You have ${openUnvoted} open market${openUnvoted !== 1 ? "s" : ""} you haven't voted on yet. Make your forecasts!`;
      } else {
        return; // User has voted on everything, skip
      }

      const payload = JSON.stringify({
        title,
        body,
        link: "/questions",
        tag: "daily_reminder",
      });

      try {
        await wp.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 410 || statusCode === 404) {
          toDelete.push(sub.endpoint);
        }
      }
    })
  );

  if (toDelete.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("endpoint", toDelete);
  }

  return NextResponse.json({ sent, total: allUserIds.length });
}
