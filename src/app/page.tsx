import { createClient } from "@/lib/supabase/server";
import { SeasonBanner } from "@/components/season-banner";
import { QuestionCard } from "@/components/question-card";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { seasonScore, rankUsers, UserScore } from "@/lib/scoring";
import Link from "next/link";
import { BarChart3, Trophy, ShieldCheck, Target } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get current live season
  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .eq("status", "LIVE")
    .single();

  // Get upcoming questions
  let upcomingQuestions: any[] = [];
  if (season) {
    const { data } = await supabase
      .from("questions")
      .select("*")
      .eq("season_id", season.id)
      .eq("status", "OPEN")
      .gt("close_time", new Date().toISOString())
      .order("close_time", { ascending: true })
      .limit(3);

    if (data) {
      for (const q of data) {
        const [{ count }, { data: allForecasts }] = await Promise.all([
          supabase
            .from("forecasts")
            .select("*", { count: "exact", head: true })
            .eq("question_id", q.id),
          supabase
            .from("forecasts")
            .select("probability")
            .eq("question_id", q.id),
        ]);

        const consensus = allForecasts && allForecasts.length > 0
          ? allForecasts.reduce((sum, f) => sum + f.probability, 0) / allForecasts.length
          : null;

        let userProb = null;
        if (user) {
          const { data: forecast } = await supabase
            .from("forecasts")
            .select("probability")
            .eq("user_id", user.id)
            .eq("question_id", q.id)
            .single();
          userProb = forecast?.probability ?? null;
        }

        upcomingQuestions.push({ ...q, forecast_count: count || 0, user_probability: userProb, consensus });
      }
    }
  }

  // Get top 5 leaderboard from season entries
  let leaderboardEntries: any[] = [];
  let allRanked: UserScore[] = [];
  if (season) {
    const { data: entries } = await supabase
      .from("season_entries")
      .select("user_id, created_at, profiles(id, name, email, display_name)")
      .eq("season_id", season.id)
      .in("status", ["PAID", "JOINED"]);

    if (entries && entries.length > 0) {
      const { data: resolvedQuestions } = await supabase
        .from("questions")
        .select("id, resolved_outcome")
        .eq("season_id", season.id)
        .eq("status", "RESOLVED");

      const resolvedIds = resolvedQuestions?.map((q) => q.id) || [];
      const resolvedMap = new Map(resolvedQuestions?.map((q) => [q.id, q.resolved_outcome]) || []);

      let allForecasts: any[] = [];
      if (resolvedIds.length > 0) {
        const { data } = await supabase
          .from("forecasts")
          .select("user_id, question_id, probability, submitted_at")
          .in("question_id", resolvedIds);
        allForecasts = data || [];
      }

      const totalResolved = resolvedIds.length;

      const users: UserScore[] = entries.map((entry) => {
        const userForecasts = allForecasts
          .filter((f) => f.user_id === entry.user_id);
        const scoringForecasts = userForecasts.map((f: any) => ({
          probability: f.probability,
          outcome: resolvedMap.get(f.question_id)!,
        }));
        const profile = entry.profiles as unknown as { id: string; name: string; email: string; display_name: string | null };
        const participationPct = totalResolved > 0 ? (userForecasts.length / totalResolved) * 100 : 0;
        const avgSubmissionTime = userForecasts.length > 0
          ? userForecasts.reduce((sum: number, f: any) => sum + new Date(f.submitted_at).getTime(), 0) / userForecasts.length
          : Infinity;
        return {
          userId: entry.user_id,
          name: profile?.display_name || profile?.name || profile?.email || "Unknown",
          score: seasonScore(scoringForecasts),
          questionsPlayed: userForecasts.length,
          joinedAt: entry.created_at ? new Date(entry.created_at) : null,
          totalResolvedQuestions: totalResolved,
          participationPct,
          qualifiesForPrize: userForecasts.length >= 5,
          avgSubmissionTime,
        };
      });

      const ranked = rankUsers(users);
      allRanked = ranked;
      const prizeAmounts = [season.prize_1st_cents, season.prize_2nd_cents, season.prize_3rd_cents];

      // Query referral counts
      const { data: referralRows } = await supabase
        .from("profiles")
        .select("referred_by")
        .not("referred_by", "is", null);

      const referralCounts = new Map<string, number>();
      for (const row of referralRows ?? []) {
        const id = row.referred_by as string;
        referralCounts.set(id, (referralCounts.get(id) || 0) + 1);
      }

      leaderboardEntries = ranked.slice(0, 5).map((u, i) => {
        const rawReferrals = referralCounts.get(u.userId) || 0;
        const referralBonus = Math.min(rawReferrals, 3) * 0.01;
        return {
          rank: i + 1,
          userId: u.userId,
          name: u.name,
          score: u.score + referralBonus,
          questionsPlayed: u.questionsPlayed,
          isCurrentUser: u.userId === user?.id,
          participationPct: u.participationPct,
          qualifiesForPrize: u.qualifiesForPrize,
          prizeCents: u.qualifiesForPrize && i < 3 ? prizeAmounts[i] : undefined,
          referralBonus: rawReferrals > 0 ? Math.min(rawReferrals, 3) : undefined,
        };
      });
    }
  }

  // Show How It Works to users who haven't forecasted yet
  let hasForecasted = false;
  if (user && season) {
    const { count } = await supabase
      .from("forecasts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    hasForecasted = (count ?? 0) > 0;
  }

  return (
    <div className="space-y-6">
      {season ? (
        <SeasonBanner
          id={season.id}
          name={season.name}
          startDate={season.start_date}
          endDate={season.end_date}
          prize1stCents={season.prize_1st_cents}
          prize2ndCents={season.prize_2nd_cents}
          prize3rdCents={season.prize_3rd_cents}
          prizeBonusCents={season.prize_bonus_cents}
          status={season.status}
        />
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No active season right now. Check back soon!
          </CardContent>
        </Card>
      )}

      {!hasForecasted && season && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex gap-3">
                <Target className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Make Predictions</p>
                  <p className="text-sm text-muted-foreground">Assign probabilities (0-100%) to campus questions. Think it&apos;ll rain at formal? Say 70%.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <BarChart3 className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Brier Scoring</p>
                  <p className="text-sm text-muted-foreground">You&apos;re scored on accuracy. Confident and correct? Big points. Wrong? You lose points.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <ShieldCheck className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Stay Active</p>
                  <p className="text-sm text-muted-foreground">Forecast on at least 5 markets to qualify for prizes.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Trophy className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Win Prizes</p>
                  <p className="text-sm text-muted-foreground">Prizes paid out every 2 weeks to the top of the leaderboard.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {upcomingQuestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Upcoming Deadlines</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/questions">View all</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {upcomingQuestions.map((q) => (
              <QuestionCard
                key={q.id}
                id={q.id}
                title={q.title}
                category={q.category}
                status={q.status}
                closeTime={q.close_time}
                forecastCount={q.forecast_count}
                userProbability={q.user_probability}
                consensus={q.consensus}
              />
            ))}
          </div>
        </div>
      )}

      {leaderboardEntries.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Leaderboard</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/leaderboard">Full leaderboard</Link>
            </Button>
          </div>
          <Card>
            <CardContent className="pt-4">
              <LeaderboardTable entries={leaderboardEntries} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
