import { createClient } from "@/lib/supabase/server";
import { QuestionCard } from "@/components/question-card";
import { ShieldCheck, AlertCircle } from "lucide-react";

export default async function QuestionsPage() {
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
    return <div className="text-center py-12 text-muted-foreground">No active season found.</div>;
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("season_id", season.id)
    .order("close_time", { ascending: true });

  const allQuestions = questions || [];

  // Get forecast counts, consensus, and user forecasts
  const enriched = await Promise.all(
    allQuestions.map(async (q) => {
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

      return { ...q, forecast_count: count || 0, user_probability: userProb, consensus };
    })
  );

  const open = enriched.filter((q) => q.status === "OPEN");
  const closed = enriched.filter((q) => q.status === "CLOSED");
  const resolved = enriched.filter((q) => q.status === "RESOLVED");

  const allVisible = [...open, ...closed, ...resolved];

  // Participation tracking for logged-in users
  const totalMarkets = allVisible.length;
  const forecastedCount = user ? enriched.filter((q) => q.user_probability !== null).length : 0;
  const minPct = season.min_participation_pct ?? 70;
  const needed = Math.ceil(totalMarkets * minPct / 100);
  const remaining = Math.max(0, needed - forecastedCount);
  const qualifies = forecastedCount >= needed;
  const pct = totalMarkets > 0 ? Math.min((forecastedCount / needed) * 100, 100) : 0;

  return (
    <div className="space-y-4">
      {/* Participation tracker */}
      {user && totalMarkets > 0 && (
        <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${qualifies ? "border-green-500/30 bg-green-500/5" : "border-amber-500/30 bg-amber-500/5"}`}>
          {qualifies ? (
            <ShieldCheck className="h-5 w-5 text-green-500 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-medium">
                {qualifies
                  ? `You qualify for prizes! (${forecastedCount}/${totalMarkets} markets)`
                  : `Forecast on ${remaining} more market${remaining !== 1 ? "s" : ""} to qualify for prizes`}
              </span>
              <span className="text-muted-foreground shrink-0">{forecastedCount}/{totalMarkets}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${qualifies ? "bg-green-500" : "bg-amber-500"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
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
              consensus={q.consensus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
