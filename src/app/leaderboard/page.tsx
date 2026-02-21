import { createClient } from "@/lib/supabase/server";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { seasonScore, rankUsers, UserScore } from "@/lib/scoring";
import { formatDollars } from "@/lib/utils";
import { Trophy } from "lucide-react";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .in("status", ["LIVE", "ENDED"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!season) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No active season found.
      </div>
    );
  }

  const totalPrize = season.prize_1st_cents + season.prize_2nd_cents + season.prize_3rd_cents + season.prize_bonus_cents;

  // Get entries with PAID or JOINED status
  const { data: entries } = await supabase
    .from("season_entries")
    .select("user_id, paid_at, created_at, profiles(id, name, email, avatar_url, display_name)")
    .eq("season_id", season.id)
    .in("status", ["PAID", "JOINED"]);

  // Get resolved questions for this season
  const { data: resolvedQuestions } = await supabase
    .from("questions")
    .select("id, resolved_outcome")
    .eq("season_id", season.id)
    .eq("status", "RESOLVED");

  const resolvedQuestionIds = (resolvedQuestions ?? []).map((q) => q.id);
  const resolvedCount = resolvedQuestionIds.length;

  // Get all forecasts for resolved questions
  const { data: forecasts } = resolvedQuestionIds.length > 0
    ? await supabase
        .from("forecasts")
        .select("user_id, question_id, probability, submitted_at")
        .in("question_id", resolvedQuestionIds)
    : { data: [] as { user_id: string; question_id: string; probability: number; submitted_at: string }[] };

  // Build a map of question_id -> resolved_outcome
  const outcomeMap = new Map(
    (resolvedQuestions ?? []).map((q) => [q.id, q.resolved_outcome as boolean])
  );

  // Build a map of user_id -> forecasts
  const forecastsByUser = new Map<string, { probability: number; outcome: boolean; submittedAt: string }[]>();
  for (const f of forecasts ?? []) {
    const outcome = outcomeMap.get(f.question_id);
    if (outcome === undefined) continue;
    if (!forecastsByUser.has(f.user_id)) forecastsByUser.set(f.user_id, []);
    forecastsByUser.get(f.user_id)!.push({ probability: f.probability, outcome, submittedAt: f.submitted_at });
  }

  const users: UserScore[] = (entries ?? []).map((entry) => {
    const profile = entry.profiles as unknown as { id: string; name: string | null; email: string; avatar_url: string | null; display_name: string | null } | null;
    const userForecasts = forecastsByUser.get(entry.user_id) ?? [];
    const participationPct = resolvedCount > 0 ? (userForecasts.length / resolvedCount) * 100 : 0;
    const avgSubmissionTime = userForecasts.length > 0
      ? userForecasts.reduce((sum, f) => sum + new Date(f.submittedAt).getTime(), 0) / userForecasts.length
      : Infinity;
    return {
      userId: entry.user_id,
      name: profile?.display_name || profile?.name || profile?.email || "Anonymous",
      score: seasonScore(userForecasts.map(f => ({ probability: f.probability, outcome: f.outcome }))),
      questionsPlayed: userForecasts.length,
      joinedAt: entry.created_at ? new Date(entry.created_at) : null,
      totalResolvedQuestions: resolvedCount,
      participationPct,
      qualifiesForPrize: participationPct >= (season.min_participation_pct ?? 70),
      avgSubmissionTime,
    };
  });

  const ranked = rankUsers(users);
  const prizeAmounts = [season.prize_1st_cents, season.prize_2nd_cents, season.prize_3rd_cents];

  const leaderboardEntries = ranked.map((u, i) => {
    const entry = (entries ?? []).find((e) => e.user_id === u.userId);
    const profile = entry?.profiles as unknown as { id: string; name: string | null; email: string; avatar_url: string | null } | null;
    return {
      rank: i + 1,
      userId: u.userId,
      name: u.name,
      image: profile?.avatar_url,
      score: u.score,
      questionsPlayed: u.questionsPlayed,
      isCurrentUser: u.userId === user?.id,
      participationPct: u.participationPct,
      qualifiesForPrize: u.qualifiesForPrize,
      prizeCents: u.qualifiesForPrize && i < 3 ? prizeAmounts[i] : undefined,
    };
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="font-semibold">Prize Pool: $1,000</p>
              <p className="text-sm text-muted-foreground">
                1st $350 · 2nd $225 · 3rd $150 · 4th $100 · 5th $75 · Bonus $100
              </p>
            </div>
            <Badge variant="secondary" className="ml-auto">
              Min {season.min_participation_pct}% participation
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <LeaderboardTable entries={leaderboardEntries} />
        </CardContent>
      </Card>
    </div>
  );
}
