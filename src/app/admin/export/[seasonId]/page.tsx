import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { ExportActions } from "./export-actions";
import { seasonScore, rankUsers, UserScore } from "@/lib/scoring";

export default async function ExportPage({ params }: { params: Promise<{ seasonId: string }> }) {
  const { seasonId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") redirect("/");

  const { data: season } = await supabase.from("seasons").select("*").eq("id", seasonId).single();
  if (!season) notFound();

  // Get paid entries with profile data
  const { data: entries } = await supabase
    .from("season_entries")
    .select("user_id, paid_at, profiles(id, name, email, avatar_url)")
    .eq("season_id", seasonId)
    .eq("status", "PAID");

  // Get resolved questions for this season
  const { data: resolvedQuestions } = await supabase
    .from("questions")
    .select("id, resolved_outcome")
    .eq("season_id", seasonId)
    .eq("status", "RESOLVED");

  const resolvedQuestionIds = (resolvedQuestions ?? []).map((q) => q.id);

  // Get all forecasts for resolved questions
  const { data: forecasts } = resolvedQuestionIds.length > 0
    ? await supabase
        .from("forecasts")
        .select("user_id, question_id, probability")
        .in("question_id", resolvedQuestionIds)
    : { data: [] as { user_id: string; question_id: string; probability: number }[] };

  // Build a map of question_id -> resolved_outcome for quick lookup
  const outcomeMap = Object.fromEntries(
    (resolvedQuestions ?? []).map((q) => [q.id, q.resolved_outcome])
  );

  // Build a map of user_id -> their forecasts
  const forecastsByUser = new Map<string, { probability: number; outcome: boolean }[]>();
  for (const f of forecasts ?? []) {
    if (!forecastsByUser.has(f.user_id)) {
      forecastsByUser.set(f.user_id, []);
    }
    forecastsByUser.get(f.user_id)!.push({
      probability: f.probability,
      outcome: outcomeMap[f.question_id]!,
    });
  }

  const safeEntries = entries ?? [];

  const users: UserScore[] = safeEntries.map((entry) => {
    const userProfile = entry.profiles as unknown as { id: string; name: string | null; email: string; avatar_url: string | null };
    const userForecasts = forecastsByUser.get(entry.user_id) ?? [];
    return {
      userId: entry.user_id,
      name: userProfile?.name || userProfile?.email || "Unknown",
      score: seasonScore(userForecasts),
      questionsPlayed: userForecasts.length,
      paidAt: entry.paid_at ? new Date(entry.paid_at) : null,
    };
  });

  const ranked = rankUsers(users);

  const leaderboardEntries = ranked.map((u, i) => {
    const entry = safeEntries.find((e) => e.user_id === u.userId);
    const userProfile = entry?.profiles as unknown as { id: string; name: string | null; email: string; avatar_url: string | null };
    return {
      rank: i + 1,
      userId: u.userId,
      name: u.name,
      image: userProfile?.avatar_url,
      score: u.score,
      questionsPlayed: u.questionsPlayed,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Export — {season.name}</h1>
        <p className="text-muted-foreground">
          {safeEntries.length} paid entries · Status: {season.status}
        </p>
      </div>

      <ExportActions seasonId={seasonId} status={season.status} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Final Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <LeaderboardTable entries={leaderboardEntries} />
        </CardContent>
      </Card>
    </div>
  );
}
