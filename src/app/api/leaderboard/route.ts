import { createAdminClient } from "@/lib/supabase/server";
import { winLossRecord, rankUsers, UserScore } from "@/lib/scoring";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
  const supabase = await createAdminClient();

  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .in("status", ["LIVE", "ENDED"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!season) {
    return NextResponse.json({ season: null, entries: [], resolvedCount: 0 });
  }

  const [entriesResult, resolvedResult] = await Promise.all([
    supabase
      .from("season_entries")
      .select("user_id, paid_at, created_at, profiles(id, name, display_name, role)")
      .eq("season_id", season.id)
      .in("status", ["PAID", "JOINED"]),
    supabase
      .from("questions")
      .select("id, resolved_outcome")
      .eq("season_id", season.id)
      .eq("status", "RESOLVED"),
  ]);

  const entries = entriesResult.data ?? [];
  const resolvedQuestions = resolvedResult.data ?? [];
  const resolvedQuestionIds = resolvedQuestions.map((q) => q.id);
  const resolvedCount = resolvedQuestionIds.length;

  const { data: forecasts } = resolvedQuestionIds.length > 0
    ? await supabase
        .from("forecasts")
        .select("user_id, question_id, probability, submitted_at")
        .in("question_id", resolvedQuestionIds)
    : { data: [] as { user_id: string; question_id: string; probability: number; submitted_at: string }[] };

  const outcomeMap = new Map(
    resolvedQuestions.map((q) => [q.id, q.resolved_outcome as boolean])
  );

  const forecastsByUser = new Map<string, { probability: number; outcome: boolean; submittedAt: string }[]>();
  for (const f of forecasts ?? []) {
    const outcome = outcomeMap.get(f.question_id);
    if (outcome === undefined) continue;
    if (!forecastsByUser.has(f.user_id)) forecastsByUser.set(f.user_id, []);
    forecastsByUser.get(f.user_id)!.push({ probability: f.probability, outcome, submittedAt: f.submitted_at });
  }

  const users: UserScore[] = entries.map((entry) => {
    const profile = entry.profiles as unknown as { id: string; name: string | null; display_name: string | null; role: string | null } | null;
    const userForecasts = forecastsByUser.get(entry.user_id) ?? [];
    const participationPct = resolvedCount > 0 ? (userForecasts.length / resolvedCount) * 100 : 0;
    const avgSubmissionTime = userForecasts.length > 0
      ? userForecasts.reduce((sum, f) => sum + new Date(f.submittedAt).getTime(), 0) / userForecasts.length
      : Infinity;
    const { wins, losses } = winLossRecord(userForecasts.map(f => ({ probability: f.probability, outcome: f.outcome })));
    return {
      userId: entry.user_id,
      name: profile?.display_name || profile?.name || "Anonymous",
      wins,
      losses,
      questionsPlayed: userForecasts.length,
      joinedAt: entry.created_at ? new Date(entry.created_at) : null,
      totalResolvedQuestions: resolvedCount,
      participationPct,
      qualifiesForPrize: userForecasts.length >= 15,
      avgSubmissionTime,
    };
  });

  const roleMap = new Map<string, string>();
  for (const entry of entries) {
    const profile = entry.profiles as unknown as { id: string; role: string | null } | null;
    if (profile?.role) roleMap.set(entry.user_id, profile.role);
  }

  const ranked = rankUsers(users);
  const prizeAmounts = [season.prize_1st_cents, season.prize_2nd_cents, season.prize_3rd_cents, season.prize_4th_cents, season.prize_5th_cents];

  const leaderboardEntries = ranked.map((u, i) => ({
    rank: i + 1,
    userId: u.userId,
    name: u.name,
    wins: u.wins,
    losses: u.losses,
    questionsPlayed: u.questionsPlayed,
    qualifiesForPrize: u.qualifiesForPrize,
    prizeCents: u.qualifiesForPrize && i < 5 ? prizeAmounts[i] : undefined,
    isFounder: roleMap.get(u.userId) === "ADMIN" && u.name === "Forecast Founder",
  }));

  return NextResponse.json({
    season: {
      id: season.id,
      name: season.name,
      startDate: season.start_date,
      endDate: season.end_date,
      prize1stCents: season.prize_1st_cents,
      prize2ndCents: season.prize_2nd_cents,
      prize3rdCents: season.prize_3rd_cents,
      prize4thCents: season.prize_4th_cents,
      prize5thCents: season.prize_5th_cents,
      prizeBonusCents: season.prize_bonus_cents,
      status: season.status,
    },
    entries: leaderboardEntries,
    participantIds: ranked.map((u) => u.userId),
    resolvedCount,
  });
  } catch (e) {
    console.error("[api/leaderboard]", e);
    return NextResponse.json({ season: null, entries: [], resolvedCount: 0 }, { status: 500 });
  }
}
