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

  // Check if user has paid entry
  let isPaid = false;
  if (user && season) {
    const { data: entry } = await supabase
      .from("season_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("season_id", season.id)
      .single();
    isPaid = entry?.status === "PAID";
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
      .select("user_id, paid_at, profiles(id, name, email, avatar_url)")
      .eq("season_id", season.id)
      .eq("status", "PAID");

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
          .select("user_id, question_id, probability")
          .in("question_id", resolvedIds);
        allForecasts = data || [];
      }

      const users: UserScore[] = entries.map((entry) => {
        const userForecasts = allForecasts
          .filter((f) => f.user_id === entry.user_id)
          .map((f) => ({ probability: f.probability, outcome: resolvedMap.get(f.question_id)! }));
        const profile = entry.profiles as unknown as { id: string; name: string; email: string; avatar_url: string };
        return {
          userId: entry.user_id,
          name: profile?.name || profile?.email || "Unknown",
          score: seasonScore(userForecasts),
          questionsPlayed: userForecasts.length,
          paidAt: entry.paid_at ? new Date(entry.paid_at) : null,
        };
      });

      const ranked = rankUsers(users);
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
        };
      });
    }
  }

  // Get user profile for auth check
  let profile = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = data;
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
          entryFeeCents={season.entry_fee_cents}
          status={season.status}
          isPaid={isPaid}
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
