import { createClient, createAdminClient } from "@/lib/supabase/server";
import { QuestionCard } from "@/components/question-card";
import { SuggestQuestion } from "@/components/suggest-question";
import { WarningCircle, Cards } from "@phosphor-icons/react/ssr";
import Link from "next/link";

export const metadata = {
  title: "Markets — Forecaster",
  description: "Browse and forecast on campus prediction markets at W&L.",
};

export default async function QuestionsPage() {
  const supabase = await createAdminClient();
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .in("status", ["LIVE", "ENDED"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!season) {
    return <div className="text-center py-12 text-muted-foreground">No active season found.</div>;
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("season_id", season.id)
    .order("close_time", { ascending: true });

  const allQuestions = questions || [];
  const questionIds = allQuestions.map((q) => q.id);

  // Batch fetch forecast counts and user forecasts (avoids N+1)
  const [forecastCountMap, userForecastMap] = await Promise.all([
    (async () => {
      if (questionIds.length === 0) return new Map<string, number>();
      const counts = new Map<string, number>();
      const BATCH = 25;
      for (let i = 0; i < questionIds.length; i += BATCH) {
        const batch = questionIds.slice(i, i + BATCH);
        let offset = 0;
        while (true) {
          const { data } = await supabase
            .from("forecasts")
            .select("question_id")
            .in("question_id", batch)
            .range(offset, offset + 999);
          if (!data || data.length === 0) break;
          for (const f of data) {
            counts.set(f.question_id, (counts.get(f.question_id) || 0) + 1);
          }
          if (data.length < 1000) break;
          offset += 1000;
        }
      }
      return counts;
    })(),
    (async () => {
      if (!user || questionIds.length === 0) return new Map<string, number>();
      const probs = new Map<string, number>();
      const { data } = await supabase
        .from("forecasts")
        .select("question_id, probability")
        .eq("user_id", user.id)
        .in("question_id", questionIds);
      for (const f of data ?? []) {
        probs.set(f.question_id, f.probability);
      }
      return probs;
    })(),
  ]);

  const enriched = allQuestions.map((q) => ({
    ...q,
    forecast_count: forecastCountMap.get(q.id) || 0,
    user_probability: userForecastMap.get(q.id) ?? null,
  }));

  const sortByVoted = <T extends { user_probability: number | null }>(arr: T[]) =>
    [...arr].sort((a, b) => (a.user_probability !== null ? 1 : 0) - (b.user_probability !== null ? 1 : 0));

  const now = new Date().toISOString();
  const open = sortByVoted(enriched.filter((q) => q.status === "OPEN" && q.close_time > now));
  const expired = sortByVoted(enriched.filter((q) => q.status === "OPEN" && q.close_time <= now));
  const closed = sortByVoted(enriched.filter((q) => q.status === "CLOSED"));
  const resolved = sortByVoted(enriched.filter((q) => q.status === "RESOLVED"));

  const allVisible = [...open, ...resolved, ...expired, ...closed];

  // Participation tracking for logged-in users
  const totalMarkets = allVisible.length;
  const forecastedCount = user ? enriched.filter((q) => q.user_probability !== null).length : 0;
  const minRequired = 15;
  const remaining = Math.max(0, minRequired - forecastedCount);
  const qualifies = forecastedCount >= minRequired;
  const pct = Math.min((forecastedCount / minRequired) * 100, 100);

  return (
    <div className="space-y-4">
      {/* Participation tracker + Suggest a Market */}
      {user && (
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
          {totalMarkets > 0 && !qualifies && (
            <div className="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm border-amber-500/30 bg-amber-500/5">
              <WarningCircle className="h-5 w-5 text-amber-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-medium">
                    Forecast on {remaining} more market{remaining !== 1 ? "s" : ""} to qualify for prizes
                  </span>
                  <span className="text-muted-foreground shrink-0">{forecastedCount}/{minRequired}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all bg-amber-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          )}
          <SuggestQuestion />
          <Link
            href="/swipe"
            className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:border-purple-500/40 hover:from-purple-500/15 hover:to-pink-500/15 active:scale-[0.98] px-4 py-2.5 text-sm font-semibold text-purple-600 dark:text-purple-400 transition-all"
          >
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-purple-500/15">
              <Cards className="h-4 w-4" />
            </div>
            Swipe Mode
          </Link>
        </div>
      )}

      {allVisible.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No questions yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {allVisible.map((q) => (
            <QuestionCard
              key={q.id}
              id={q.id}
              title={q.title}
              category={q.category}
              status={q.status}
              closeTime={q.close_time}
              forecastCount={q.forecast_count}
              resolvedOutcome={q.resolved_outcome}
              userProbability={q.user_probability}
            />
          ))}
        </div>
      )}
    </div>
  );
}
