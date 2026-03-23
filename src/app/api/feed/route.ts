import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createAdminClient();

  const { data: season } = await supabase
    .from("seasons")
    .select("id, name, prize_1st_cents, prize_2nd_cents, prize_3rd_cents, prize_4th_cents, prize_5th_cents, prize_bonus_cents")
    .eq("status", "LIVE")
    .single();

  if (!season) {
    return NextResponse.json({ markets: [], seasonInfo: null });
  }

  const totalPrizeCents =
    (season.prize_1st_cents || 0) + (season.prize_2nd_cents || 0) +
    (season.prize_3rd_cents || 0) + (season.prize_4th_cents || 0) +
    (season.prize_5th_cents || 0) + (season.prize_bonus_cents || 0);

  const { data: questions } = await supabase
    .from("questions")
    .select("id, title, description, category, image_url")
    .eq("season_id", season.id)
    .eq("status", "OPEN")
    .gt("close_time", new Date().toISOString())
    .order("close_time", { ascending: true });

  if (!questions || questions.length === 0) {
    return NextResponse.json({
      markets: [],
      seasonInfo: { name: season.name, totalPrizeCents },
    });
  }

  // Vote counts + YES/NO split in single query
  const questionIds = questions.map((q) => q.id);
  const { data: allForecasts } = await supabase
    .from("forecasts")
    .select("question_id, probability")
    .in("question_id", questionIds);

  const voteCounts = new Map<string, number>();
  const yesCounts = new Map<string, number>();
  for (const f of allForecasts ?? []) {
    voteCounts.set(f.question_id, (voteCounts.get(f.question_id) || 0) + 1);
    if (f.probability >= 0.5) {
      yesCounts.set(f.question_id, (yesCounts.get(f.question_id) || 0) + 1);
    }
  }

  const markets = questions.map((q) => ({
    id: q.id,
    title: q.title,
    description: q.description,
    category: q.category,
    imageUrl: q.image_url,
    voteCount: voteCounts.get(q.id) || 0,
    yesCount: yesCounts.get(q.id) || 0,
  }));

  // Recent activity — last 10 votes in the past 60 minutes
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: recentVotes } = await supabase
    .from("forecasts")
    .select("user_id, question_id, submitted_at")
    .in("question_id", questionIds)
    .gt("submitted_at", since)
    .order("submitted_at", { ascending: false })
    .limit(15);

  let recentActivity: { displayName: string; questionTitle: string }[] = [];
  if (recentVotes && recentVotes.length > 0) {
    const userIds = [...new Set(recentVotes.map((v) => v.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, name")
      .in("id", userIds);
    const nameMap = new Map<string, string>();
    for (const p of profiles ?? []) {
      nameMap.set(p.id, p.display_name || p.name || "Anonymous");
    }
    const titleMap = new Map(questions.map((q) => [q.id, q.title]));

    // Deduplicate by user (one entry per user, most recent)
    const seen = new Set<string>();
    for (const v of recentVotes) {
      if (seen.has(v.user_id)) continue;
      seen.add(v.user_id);
      const name = nameMap.get(v.user_id);
      const title = titleMap.get(v.question_id);
      if (name && title) {
        recentActivity.push({ displayName: name, questionTitle: title });
      }
      if (recentActivity.length >= 10) break;
    }
  }

  return NextResponse.json({
    markets,
    seasonInfo: { name: season.name, totalPrizeCents },
    recentActivity,
  });
}
