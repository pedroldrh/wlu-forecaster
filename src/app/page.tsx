import { createClient, createAdminClient } from "@/lib/supabase/server";
import { SeasonBanner } from "@/components/season-banner";
import { QuestionCard } from "@/components/question-card";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { winLossRecord, rankUsers, UserScore } from "@/lib/scoring";
import Link from "next/link";
import { Trophy, ShieldCheck, Crosshair } from "@phosphor-icons/react/ssr";

export default async function HomePage() {
  const supabase = await createAdminClient();
  let user: { id: string } | null = null;
  try {
    const authClient = await createClient();
    const { data } = await authClient.auth.getUser();
    user = data.user;
  } catch {}

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
      .limit(4);

    if (data) {
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

  // Get participant IDs for season banner
  let allRanked: UserScore[] = [];
  if (season) {
    const { data: entries } = await supabase
      .from("season_entries")
      .select("user_id, created_at, profiles(id, name, display_name)")
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
        const userForecasts = allForecasts.filter((f) => f.user_id === entry.user_id);
        const scoringForecasts = userForecasts.map((f: any) => ({
          probability: f.probability,
          outcome: resolvedMap.get(f.question_id)!,
        }));
        const profile = entry.profiles as unknown as { id: string; name: string; display_name: string | null };
        const participationPct = totalResolved > 0 ? (userForecasts.length / totalResolved) * 100 : 0;
        const avgSubmissionTime = userForecasts.length > 0
          ? userForecasts.reduce((sum: number, f: any) => sum + new Date(f.submitted_at).getTime(), 0) / userForecasts.length
          : Infinity;
        const { wins, losses } = winLossRecord(scoringForecasts);
        return {
          userId: entry.user_id,
          name: profile?.display_name || profile?.name || "Anonymous",
          wins,
          losses,
          questionsPlayed: userForecasts.length,
          joinedAt: entry.created_at ? new Date(entry.created_at) : null,
          totalResolvedQuestions: totalResolved,
          participationPct,
          qualifiesForPrize: userForecasts.length >= 15,
          avgSubmissionTime,
        };
      });

      allRanked = rankUsers(users);
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
          prize4thCents={season.prize_4th_cents}
          prize5thCents={season.prize_5th_cents}
          prizeBonusCents={season.prize_bonus_cents}
          status={season.status}
          participantIds={allRanked.map((u) => u.userId)}
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
                <Crosshair className="h-5 w-5 mt-0.5 shrink-0 text-blue-500" />
                <div>
                  <p className="font-medium text-sm">Vote YES or NO</p>
                  <p className="text-sm text-muted-foreground">Each market is a yes-or-no question about W&L. Pick your answer.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <ShieldCheck className="h-5 w-5 mt-0.5 shrink-0 text-emerald-500" />
                <div>
                  <p className="font-medium text-sm">Build Your Record</p>
                  <p className="text-sm text-muted-foreground">Get it right, get a W. Get it wrong, take an L. Your record shows on the leaderboard.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Trophy className="h-5 w-5 mt-0.5 shrink-0 text-amber-500" />
                <div>
                  <p className="font-medium text-sm">Win Real Money</p>
                  <p className="text-sm text-muted-foreground">Vote on 15+ markets to qualify. Best record wins cash from the prize pool.</p>
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
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="font-semibold text-lg">How It Works</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="bg-gradient-to-br from-blue-500/5 to-transparent">
            <CardContent className="pt-4 pb-4 space-y-2">
              <div className="h-8 w-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <Crosshair className="h-4 w-4 text-blue-500" />
              </div>
              <p className="font-semibold text-sm">Vote YES or NO</p>
              <p className="text-xs text-muted-foreground">Each market is a yes-or-no question about W&L. Pick your answer.</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500/5 to-transparent">
            <CardContent className="pt-4 pb-4 space-y-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="font-semibold text-sm">Build Your Record</p>
              <p className="text-xs text-muted-foreground">Get it right, get a W. Get it wrong, take an L. Your record shows on the leaderboard.</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/5 to-transparent">
            <CardContent className="pt-4 pb-4 space-y-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <Trophy className="h-4 w-4 text-amber-500" />
              </div>
              <p className="font-semibold text-sm">Win Real Money</p>
              <p className="text-xs text-muted-foreground">Vote on 15+ markets to qualify. Best record wins cash from the prize pool.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
