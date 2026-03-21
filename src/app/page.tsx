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
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="font-semibold text-lg">How Forecasting Works</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="bg-gradient-to-br from-blue-500/5 to-transparent">
            <CardContent className="pt-4 pb-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                  <Crosshair className="h-4 w-4 text-blue-500" />
                </div>
                <p className="font-semibold text-sm">Pick a Probability</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Each question is yes or no. You pick <span className="text-foreground font-medium">how likely</span> (0-100%). Saying 80% means &quot;8 out of 10 times, this happens.&quot;
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/5 to-transparent">
            <CardContent className="pt-4 pb-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                  <ForecasterLogo className="h-4 w-4 text-purple-500" />
                </div>
                <p className="font-semibold text-sm">Brier Scoring</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your score: <span className="text-foreground font-mono font-medium">100 &times; (1 - (forecast - outcome)&sup2;)</span>
              </p>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div className="rounded-md bg-emerald-500/10 px-2 py-1.5 text-center">
                  <p className="text-emerald-600 font-semibold">90% &rarr; YES</p>
                  <p className="text-emerald-600/80 font-mono">99 pts</p>
                </div>
                <div className="rounded-md bg-rose-500/10 px-2 py-1.5 text-center">
                  <p className="text-rose-600 font-semibold">90% &rarr; NO</p>
                  <p className="text-rose-600/80 font-mono">19 pts</p>
                </div>
                <div className="rounded-md bg-emerald-500/10 px-2 py-1.5 text-center">
                  <p className="text-emerald-600 font-semibold">60% &rarr; YES</p>
                  <p className="text-emerald-600/80 font-mono">84 pts</p>
                </div>
                <div className="rounded-md bg-amber-500/10 px-2 py-1.5 text-center">
                  <p className="text-amber-600 font-semibold">50% &rarr; either</p>
                  <p className="text-amber-600/80 font-mono">75 pts</p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Higher confidence = higher reward if right, bigger penalty if wrong.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/5 to-transparent">
            <CardContent className="pt-4 pb-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-amber-500" />
                </div>
                <p className="font-semibold text-sm">The Consensus Graph</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Each market shows a live graph of the <span className="text-foreground font-medium">crowd&apos;s average prediction</span> over time. Use it to spot where you disagree with everyone else.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/5 to-transparent">
            <CardContent className="pt-4 pb-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="font-semibold text-sm">Win Real Money</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Forecast on 5+ markets to qualify. Top forecasters win cash prizes from the prize pool. <Link href="/leaderboard" className="text-primary hover:underline">View leaderboard</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
