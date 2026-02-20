import { createClient } from "@/lib/supabase/server";
import { SeasonBanner } from "@/components/season-banner";
import { QuestionCard } from "@/components/question-card";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { seasonScore, rankUsers, UserScore } from "@/lib/scoring";
import Link from "next/link";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get current live season
  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .eq("status", "LIVE")
    .single();

  // Check if user has joined (PAID or JOINED)
  let isJoined = false;
  if (user && season) {
    const { data: entry } = await supabase
      .from("season_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("season_id", season.id)
      .single();
    isJoined = entry?.status === "PAID" || entry?.status === "JOINED";
  }

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
      // Get forecast counts and user forecasts for these questions
      for (const q of data) {
        const { count } = await supabase
          .from("forecasts")
          .select("*", { count: "exact", head: true })
          .eq("question_id", q.id);

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

        upcomingQuestions.push({ ...q, forecast_count: count || 0, user_probability: userProb });
      }
    }
  }

  // Get top 5 leaderboard
  let leaderboardEntries: any[] = [];
  if (season) {
    const { data: entries } = await supabase
      .from("season_entries")
      .select("user_id, paid_at, created_at, profiles(id, name, email, avatar_url, display_name)")
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
        const profile = entry.profiles as unknown as { id: string; name: string; email: string; avatar_url: string; display_name: string | null };
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
          qualifiesForPrize: participationPct >= (season.min_participation_pct ?? 70),
          avgSubmissionTime,
        };
      });

      const ranked = rankUsers(users);
      const prizeAmounts = [season.prize_1st_cents, season.prize_2nd_cents, season.prize_3rd_cents];

      leaderboardEntries = ranked.slice(0, 5).map((u, i) => {
        const entry = entries.find((e) => e.user_id === u.userId);
        const profile = entry?.profiles as unknown as { avatar_url: string };
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
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Forecaster</h1>
        <p className="text-muted-foreground">W&L Campus Forecasting Tournament</p>
      </div>

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
          isJoined={isJoined}
          isAuthenticated={!!user}
        />
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No active season right now. Check back soon!
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
            />
          ))}
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
