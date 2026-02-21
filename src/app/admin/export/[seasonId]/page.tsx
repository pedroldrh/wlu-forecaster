import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { ExportActions } from "./export-actions";
import { seasonScore, rankUsers, UserScore } from "@/lib/scoring";
import { formatDollars } from "@/lib/utils";

export default async function ExportPage({ params }: { params: Promise<{ seasonId: string }> }) {
  const { seasonId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") redirect("/");

  const { data: season } = await supabase.from("seasons").select("*").eq("id", seasonId).single();
  if (!season) notFound();

  // Get entries with PAID or JOINED status
  const { data: entries } = await supabase
    .from("season_entries")
    .select("user_id, paid_at, created_at, profiles(id, name, email, avatar_url, display_name)")
    .eq("season_id", seasonId)
    .in("status", ["PAID", "JOINED"]);

  // Get resolved questions for this season
  const { data: resolvedQuestions } = await supabase
    .from("questions")
    .select("id, resolved_outcome")
    .eq("season_id", seasonId)
    .eq("status", "RESOLVED");

  const resolvedQuestionIds = (resolvedQuestions ?? []).map((q) => q.id);
  const totalResolved = resolvedQuestionIds.length;

  // Get all forecasts for resolved questions
  const { data: forecasts } = resolvedQuestionIds.length > 0
    ? await supabase
        .from("forecasts")
        .select("user_id, question_id, probability, submitted_at")
        .in("question_id", resolvedQuestionIds)
    : { data: [] as { user_id: string; question_id: string; probability: number; submitted_at: string }[] };

  const outcomeMap = Object.fromEntries(
    (resolvedQuestions ?? []).map((q) => [q.id, q.resolved_outcome])
  );

  const forecastsByUser = new Map<string, { probability: number; outcome: boolean; submittedAt: string }[]>();
  for (const f of forecasts ?? []) {
    if (!forecastsByUser.has(f.user_id)) forecastsByUser.set(f.user_id, []);
    forecastsByUser.get(f.user_id)!.push({
      probability: f.probability,
      outcome: outcomeMap[f.question_id]!,
      submittedAt: f.submitted_at,
    });
  }

  const safeEntries = entries ?? [];

  const users: UserScore[] = safeEntries.map((entry) => {
    const userProfile = entry.profiles as unknown as { id: string; name: string | null; email: string; avatar_url: string | null; display_name: string | null };
    const userForecasts = forecastsByUser.get(entry.user_id) ?? [];
    const participationPct = totalResolved > 0 ? (userForecasts.length / totalResolved) * 100 : 0;
    const avgSubmissionTime = userForecasts.length > 0
      ? userForecasts.reduce((sum, f) => sum + new Date(f.submittedAt).getTime(), 0) / userForecasts.length
      : Infinity;
    return {
      userId: entry.user_id,
      name: userProfile?.display_name || userProfile?.name || userProfile?.email || "Unknown",
      score: seasonScore(userForecasts.map(f => ({ probability: f.probability, outcome: f.outcome }))),
      questionsPlayed: userForecasts.length,
      joinedAt: entry.created_at ? new Date(entry.created_at) : null,
      totalResolvedQuestions: totalResolved,
      participationPct,
      qualifiesForPrize: userForecasts.length >= 5,
      avgSubmissionTime,
    };
  });

  const ranked = rankUsers(users);
  const prizeAmounts = [season.prize_1st_cents, season.prize_2nd_cents, season.prize_3rd_cents];

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
      participationPct: u.participationPct,
      qualifiesForPrize: u.qualifiesForPrize,
      prizeCents: u.qualifiesForPrize && i < 3 ? prizeAmounts[i] : undefined,
    };
  });

  // Check for prize claims
  const { data: prizeClaims } = await supabase
    .from("prize_claims")
    .select("*")
    .eq("season_id", seasonId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Export — {season.name}</h1>
        <p className="text-muted-foreground">
          {safeEntries.length} participants · Prize Pool: {formatDollars(season.prize_1st_cents + season.prize_2nd_cents + season.prize_3rd_cents + season.prize_bonus_cents)} · Status: {season.status}
        </p>
      </div>

      <ExportActions seasonId={seasonId} status={season.status} />

      {(prizeClaims ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prize Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(prizeClaims ?? []).map((claim) => {
                const winner = ranked.find(u => u.userId === claim.user_id);
                return (
                  <div key={claim.id} className="flex items-center justify-between py-1">
                    <span className="text-sm">
                      {winner?.name || "Unknown"} — {claim.prize_type}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{formatDollars(claim.amount_cents)}</span>
                      <Badge variant={claim.verified ? "default" : "secondary"}>
                        {claim.verified ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
