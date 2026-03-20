import { createClient, createAdminClient } from "@/lib/supabase/server";
import { SeasonBanner } from "@/components/season-banner";
import { QuestionCard } from "@/components/question-card";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { seasonScore, rankUsers, UserScore } from "@/lib/scoring";
import Link from "next/link";
import { Trophy, ShieldCheck, Crosshair } from "@phosphor-icons/react/ssr";
import { ForecasterLogo } from "@/components/forecaster-logo";

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
        return {
          userId: entry.user_id,
          name: profile?.display_name || profile?.name || "Anonymous",
          score: seasonScore(scoringForecasts),
          questionsPlayed: userForecasts.length,
          joinedAt: entry.created_at ? new Date(entry.created_at) : null,
          totalResolvedQuestions: totalResolved,
          participationPct,
          qualifiesForPrize: userForecasts.length >= 5,
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
                <Crosshair className="h-5 w-5 mt-0.5 shrink-0 text-red-500" />
                <div>
                  <p className="font-medium text-sm">Make Predictions</p>
                  <p className="text-sm text-muted-foreground">Assign probabilities (0-100%) to campus questions. Think it&apos;ll rain at formal? Say 70%.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <ForecasterLogo className="h-5 w-5 mt-0.5 shrink-0 text-blue-500" />
                <div>
                  <p className="font-medium text-sm">Brier Scoring</p>
                  <p className="text-sm text-muted-foreground">You&apos;re scored on accuracy. Confident and correct? Big points. Wrong? You lose points.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <ShieldCheck className="h-5 w-5 mt-0.5 shrink-0 text-amber-500" />
                <div>
                  <p className="font-medium text-sm">Stay Active</p>
                  <p className="text-sm text-muted-foreground">Forecast on at least 5 markets to qualify for prizes.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Trophy className="h-5 w-5 mt-0.5 shrink-0 text-amber-500" />
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

      <div className="space-y-3">
        <h2 className="font-semibold text-lg">How Forecasting Works</h2>
        <Card>
          <CardContent className="pt-5 space-y-5">
            <div className="space-y-2">
              <p className="font-semibold text-sm flex items-center gap-2">
                <Crosshair className="h-4 w-4 text-primary shrink-0" />
                What are you predicting?
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Each market is a yes-or-no question about something that might happen at W&amp;L. Your job is to guess <span className="text-foreground font-medium">how likely</span> it is to happen — not just &quot;yes&quot; or &quot;no,&quot; but a number from 0% to 100%.
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-sm flex items-center gap-2">
                <ForecasterLogo className="h-4 w-4 text-primary shrink-0" />
                What does the percentage mean?
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Think of it like this: if you say <span className="text-foreground font-medium">80%</span>, you&apos;re saying &quot;if this exact situation happened 10 times, I think it would come true about 8 of those times.&quot; Saying 50% means you genuinely have no idea — it&apos;s a coin flip. Saying 95% means you&apos;re almost certain it&apos;ll happen.
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                How do you score points?
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                When a question resolves (the answer is revealed), you get scored based on how close your probability was to what actually happened. If you said 90% and it happened — great score. If you said 90% and it didn&apos;t happen — ouch. The key: <span className="text-foreground font-medium">being confident and right earns the most, being confident and wrong costs the most.</span> Playing it safe at 50% always gives you a medium score.
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-sm flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary shrink-0" />
                What&apos;s the consensus line on the graph?
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The graph on each market shows the <span className="text-foreground font-medium">average of everyone&apos;s predictions over time</span>. If the line is at 70%, that means the crowd collectively thinks there&apos;s a 70% chance it happens. You can use this to see if you agree with everyone else — or if you think the crowd is wrong.
              </p>
            </div>

            <div className="rounded-lg bg-muted/50 p-3.5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="text-foreground font-medium">TL;DR:</span> Pick a percentage for each question. The closer your guess is to reality, the more points you earn. Forecast on 5+ markets to qualify for prizes. Top forecasters win real money.
              </p>
            </div>

            <div className="flex justify-center pt-1">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/leaderboard">View Leaderboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
