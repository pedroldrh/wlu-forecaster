import { createClient } from "@/lib/supabase/server";
import { QuestionCard } from "@/components/question-card";

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

  return (
    <div className="space-y-4">
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
