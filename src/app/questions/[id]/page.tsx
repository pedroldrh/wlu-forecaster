import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CountdownTimer } from "@/components/countdown-timer";
import { CATEGORY_LABELS } from "@/lib/constants";
import { ForecastForm } from "./forecast-form";
import { CommentSection } from "./comment-section";
import { Users, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { brierPoints } from "@/lib/scoring";
import Link from "next/link";

export default async function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: question } = await supabase.from("questions").select("*").eq("id", id).single();
  if (!question) notFound();

  // Get forecast count
  const { count: forecastCount } = await supabase
    .from("forecasts")
    .select("*", { count: "exact", head: true })
    .eq("question_id", id);

  // Get all forecasts for consensus
  const { data: allForecasts } = await supabase
    .from("forecasts")
    .select("probability")
    .eq("question_id", id);

  let userForecast = null;
  if (user) {
    const { data: forecast } = await supabase
      .from("forecasts")
      .select("*")
      .eq("user_id", user.id)
      .eq("question_id", id)
      .single();
    userForecast = forecast;
  }

  // Get comments with profiles
  const { data: rawComments } = await supabase
    .from("comments")
    .select("id, content, created_at, user_id, profiles:user_id(name, display_name, avatar_url)")
    .eq("question_id", id)
    .order("created_at", { ascending: true });

  const comments = (rawComments || []).map((c: any) => ({
    id: c.id,
    content: c.content,
    created_at: c.created_at,
    user_id: c.user_id,
    profile: c.profiles,
  }));

  const isOpen = question.status === "OPEN" && new Date() < new Date(question.close_time);
  const forecasts = allForecasts || [];
  const consensus = forecasts.length > 0
    ? forecasts.reduce((sum, f) => sum + f.probability, 0) / forecasts.length
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/questions" className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline">{CATEGORY_LABELS[question.category] || question.category}</Badge>
          {question.status === "RESOLVED" && (
            <Badge variant={question.resolved_outcome ? "default" : "secondary"}>
              {question.resolved_outcome ? "Resolved YES" : "Resolved NO"}
            </Badge>
          )}
          {question.status === "CLOSED" && <Badge variant="secondary">Awaiting Resolution</Badge>}
          {isOpen && <Badge variant="default">Open</Badge>}
        </div>
        <h1 className="text-2xl font-bold">{question.title}</h1>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          {forecastCount || 0} forecast{forecastCount !== 1 ? "s" : ""}
        </span>
        {isOpen && <CountdownTimer targetDate={question.close_time} />}
      </div>

      {isOpen && user && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Your Forecast</CardTitle></CardHeader>
          <CardContent>
            <ForecastForm questionId={id} currentProbability={userForecast?.probability ?? null} />
          </CardContent>
        </Card>
      )}

      {isOpen && !user && (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            Sign in to submit a forecast.
          </CardContent>
        </Card>
      )}

      <Separator />

      <p className="text-muted-foreground">{question.description}</p>

      {question.status === "RESOLVED" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {question.resolved_outcome ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Resolved: {question.resolved_outcome ? "YES" : "NO"}
            </CardTitle>
          </CardHeader>
          {userForecast && (
            <CardContent>
              <div className="flex justify-between items-center">
                <span>Your forecast: {Math.round(userForecast.probability * 100)}%</span>
                <span className="font-mono font-bold text-primary">
                  {(brierPoints(userForecast.probability, question.resolved_outcome!) * 100).toFixed(1)} pts
                </span>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {question.status !== "OPEN" && consensus !== null && (
        <Card>
          <CardContent className="py-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Community consensus</span>
              <span className="font-mono font-bold text-primary">{Math.round(consensus * 100)}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      <CommentSection
        questionId={id}
        comments={comments}
        currentUserId={user?.id ?? null}
      />
    </div>
  );
}
