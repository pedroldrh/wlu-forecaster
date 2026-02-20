import { createClient } from "@/lib/supabase/server";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { Card, CardContent } from "@/components/ui/card";
import { seasonScore, rankUsers, UserScore } from "@/lib/scoring";

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

  // Get paid entries with profile data
  const { data: entries } = await supabase
    .from("season_entries")
    .select("user_id, paid_at, profiles(id, name, email, avatar_url)")
    .eq("season_id", season.id)
    .eq("status", "PAID");

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
        .select("user_id, question_id, probability")
        .in("question_id", resolvedQuestionIds)
    : { data: [] as { user_id: string; question_id: string; probability: number }[] };

  // Build a map of question_id -> resolved_outcome
  const outcomeMap = new Map(
    (resolvedQuestions ?? []).map((q) => [q.id, q.resolved_outcome as boolean])
  );

  // Build a map of user_id -> forecasts
  const forecastsByUser = new Map<string, { probability: number; outcome: boolean }[]>();
  for (const f of forecasts ?? []) {
    const outcome = outcomeMap.get(f.question_id);
    if (outcome === undefined) continue;
    if (!forecastsByUser.has(f.user_id)) forecastsByUser.set(f.user_id, []);
    forecastsByUser.get(f.user_id)!.push({ probability: f.probability, outcome });
  }

  const users: UserScore[] = (entries ?? []).map((entry) => {
    const profile = entry.profiles as unknown as { id: string; name: string | null; email: string; avatar_url: string | null } | null;
    const userForecasts = forecastsByUser.get(entry.user_id) ?? [];
    return {
      userId: entry.user_id,
      name: profile?.name || profile?.email || "Anonymous",
      score: seasonScore(userForecasts),
      questionsPlayed: userForecasts.length,
      paidAt: entry.paid_at ? new Date(entry.paid_at) : null,
    };
  });

  const ranked = rankUsers(users);

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
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground">
          {season.name} — {resolvedCount} question{resolvedCount !== 1 ? "s" : ""} resolved
        </p>
      </div>

      <Card>
        <CardContent className="pt-4">
          <LeaderboardTable entries={leaderboardEntries} />
        </CardContent>
      </Card>
    </div>
  );
}
