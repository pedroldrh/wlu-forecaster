import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CountdownTimer } from "@/components/countdown-timer";
import { CATEGORY_LABELS } from "@/lib/constants";
import { ForecastForm } from "./forecast-form";
import { Users, CheckCircle, XCircle } from "lucide-react";
import { brierPoints } from "@/lib/scoring";

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

  let isPaid = false;
  let userForecast = null;
  if (user) {
    const { data: entry } = await supabase
      .from("season_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("season_id", question.season_id)
      .single();
    isPaid = entry?.status === "PAID";

    const { data: forecast } = await supabase
      .from("forecasts")
      .select("*")
      .eq("user_id", user.id)
      .eq("question_id", id)
      .single();
    userForecast = forecast;
  }

  const isOpen = question.status === "OPEN" && new Date() < new Date(question.close_time);
  const forecasts = allForecasts || [];
  const consensus = forecasts.length > 0
    ? forecasts.reduce((sum, f) => sum + f.probability, 0) / forecasts.length
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
        <p className="text-muted-foreground">{question.description}</p>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          {forecastCount || 0} forecast{forecastCount !== 1 ? "s" : ""}
        </span>
        {isOpen && <CountdownTimer targetDate={question.close_time} />}
      </div>

      <Separator />

      {isOpen && user && isPaid && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Your Forecast</CardTitle></CardHeader>
          <CardContent>
            <ForecastForm questionId={id} currentProbability={userForecast?.probability ?? null} />
          </CardContent>
        </Card>
      )}

      {isOpen && user && !isPaid && (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            You need a paid season entry to submit forecasts.
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
                <span className="font-mono font-bold">
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
              <span className="font-mono font-bold">{Math.round(consensus * 100)}%</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
