"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { seasonScore, rankUsers, findBonusWinner, UserScore } from "@/lib/scoring";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") throw new Error("Admin access required");
  return user;
}

export async function getSeasonRankings(seasonId: string) {
  await requireAdmin();
  const supabase = await createAdminClient();

  // Get all entries with PAID or JOINED status
  const { data: entries } = await supabase
    .from("season_entries")
    .select("user_id, paid_at, created_at, profiles(name, email, display_name)")
    .eq("season_id", seasonId)
    .in("status", ["PAID", "JOINED"]);

  if (!entries) return [];

  // Get season for min participation
  const { data: season } = await supabase.from("seasons").select("min_participation_pct").eq("id", seasonId).single();
  const minPct = season?.min_participation_pct ?? 70;

  // Get all resolved questions for the season
  const { data: resolvedQuestions } = await supabase
    .from("questions")
    .select("id, resolved_outcome")
    .eq("season_id", seasonId)
    .eq("status", "RESOLVED");

  const resolvedMap = new Map(resolvedQuestions?.map((q) => [q.id, q.resolved_outcome]) || []);
  const totalResolved = resolvedQuestions?.length ?? 0;

  // Get all forecasts for resolved questions
  const resolvedIds = resolvedQuestions?.map((q) => q.id) || [];
  const { data: allForecasts } = resolvedIds.length > 0
    ? await supabase
        .from("forecasts")
        .select("user_id, question_id, probability, submitted_at")
        .in("question_id", resolvedIds)
    : { data: [] };

  const users: UserScore[] = entries.map((entry) => {
    const userForecasts = (allForecasts || [])
      .filter((f) => f.user_id === entry.user_id);

    const scoringForecasts = userForecasts.map((f) => ({
      probability: f.probability,
      outcome: resolvedMap.get(f.question_id)!,
    }));

    const participationPct = totalResolved > 0
      ? (userForecasts.length / totalResolved) * 100
      : 0;

    // Compute average submission time (ms since epoch) for tiebreaker
    const avgSubmissionTime = userForecasts.length > 0
      ? userForecasts.reduce((sum, f) => sum + new Date(f.submitted_at).getTime(), 0) / userForecasts.length
      : Infinity;

    const profile = entry.profiles as unknown as { name: string; email: string; display_name: string | null };
    return {
      userId: entry.user_id,
      name: profile?.display_name || profile?.name || profile?.email || "Unknown",
      score: seasonScore(scoringForecasts),
      questionsPlayed: userForecasts.length,
      joinedAt: entry.created_at ? new Date(entry.created_at) : null,
      totalResolvedQuestions: totalResolved,
      participationPct,
      qualifiesForPrize: participationPct >= minPct,
      avgSubmissionTime,
    };
  });

  return rankUsers(users);
}

export async function exportSeasonCSV(seasonId: string) {
  const rankings = await getSeasonRankings(seasonId);
  const supabase = await createAdminClient();

  const { data: season } = await supabase.from("seasons").select("*").eq("id", seasonId).single();
  const prizeAmounts = [
    season?.prize_1st_cents ?? 0,
    season?.prize_2nd_cents ?? 0,
    season?.prize_3rd_cents ?? 0,
  ];

  const headers = ["Rank", "Name", "Email", "Score", "Questions Played", "Participation %", "Qualified", "Prize Amount"];
  const rows = await Promise.all(
    rankings.map(async (user, index) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.userId)
        .single();

      const prizeAmount = user.qualifiesForPrize && index < 3
        ? `$${(prizeAmounts[index] / 100).toFixed(0)}`
        : "";

      return [
        index + 1,
        user.name,
        profile?.email || "",
        (user.score * 100).toFixed(1) + "%",
        user.questionsPlayed,
        user.participationPct.toFixed(0) + "%",
        user.qualifiesForPrize ? "Yes" : "No",
        prizeAmount,
      ].join(",");
    })
  );

  return [headers.join(","), ...rows].join("\n");
}

export async function createPrizeClaims(seasonId: string) {
  await requireAdmin();
  const supabase = await createAdminClient();

  const rankings = await getSeasonRankings(seasonId);
  const { data: season } = await supabase.from("seasons").select("*").eq("id", seasonId).single();
  if (!season) throw new Error("Season not found");

  const prizeMap: { type: "1ST" | "2ND" | "3RD"; cents: number }[] = [
    { type: "1ST", cents: season.prize_1st_cents },
    { type: "2ND", cents: season.prize_2nd_cents },
    { type: "3RD", cents: season.prize_3rd_cents },
  ];

  const claims: { season_id: string; user_id: string; prize_type: string; amount_cents: number }[] = [];

  // Top 3 placements (must qualify)
  const qualified = rankings.filter((u) => u.qualifiesForPrize);
  for (let i = 0; i < Math.min(3, qualified.length); i++) {
    claims.push({
      season_id: seasonId,
      user_id: qualified[i].userId,
      prize_type: prizeMap[i].type,
      amount_cents: prizeMap[i].cents,
    });
  }

  // Bonus winner
  if (season.prize_bonus_cents > 0) {
    const allForecasts = await supabase
      .from("forecasts")
      .select("user_id, question_id, probability")
      .in("question_id",
        (await supabase.from("questions").select("id").eq("season_id", seasonId).eq("status", "RESOLVED")).data?.map(q => q.id) ?? []
      );

    const resolvedQuestions = await supabase
      .from("questions")
      .select("id, resolved_outcome")
      .eq("season_id", seasonId)
      .eq("status", "RESOLVED");

    const outcomeMap = new Map(resolvedQuestions.data?.map(q => [q.id, q.resolved_outcome as boolean]) ?? []);
    const userForecastMap = new Map<string, { probability: number; outcome: boolean; questionId: string }[]>();

    for (const f of allForecasts.data ?? []) {
      const outcome = outcomeMap.get(f.question_id);
      if (outcome === undefined) continue;
      if (!userForecastMap.has(f.user_id)) userForecastMap.set(f.user_id, []);
      userForecastMap.get(f.user_id)!.push({ probability: f.probability, outcome, questionId: f.question_id });
    }

    const bonus = findBonusWinner(userForecastMap);
    if (bonus) {
      claims.push({
        season_id: seasonId,
        user_id: bonus.userId,
        prize_type: "BONUS",
        amount_cents: season.prize_bonus_cents,
      });
    }
  }

  if (claims.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from("prize_claims").upsert(claims as any, { onConflict: "season_id,user_id,prize_type" });
  }

  return { claims: claims.length };
}

export async function finalizeSeason(seasonId: string) {
  await requireAdmin();
  const supabase = await createAdminClient();
  await createPrizeClaims(seasonId);
  await supabase.from("seasons").update({ status: "ENDED" }).eq("id", seasonId);
  return { success: true };
}
