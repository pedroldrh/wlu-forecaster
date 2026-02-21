import { createClient } from "@/lib/supabase/server";
import { QuestionCard } from "@/components/question-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  const renderQuestions = (qs: typeof enriched) => {
    if (qs.length === 0) {
      return <p className="text-center text-muted-foreground py-8">No questions in this category.</p>;
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {qs.map((q) => (
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
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Questions</h1>
        <p className="text-muted-foreground">{season.name}</p>
      </div>
      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">Open ({open.length})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({closed.length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({resolved.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="open" className="mt-4">{renderQuestions(open)}</TabsContent>
        <TabsContent value="closed" className="mt-4">{renderQuestions(closed)}</TabsContent>
        <TabsContent value="resolved" className="mt-4">{renderQuestions(resolved)}</TabsContent>
      </Tabs>
    </div>
  );
}
