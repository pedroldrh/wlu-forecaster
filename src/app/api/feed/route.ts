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

  return NextResponse.json({
    markets,
    seasonInfo: { name: season.name, totalPrizeCents },
  });
}
