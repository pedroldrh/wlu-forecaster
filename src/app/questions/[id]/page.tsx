import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CountdownTimer } from "@/components/countdown-timer";
import { CATEGORY_LABELS, CATEGORY_COLORS, getQuestionEmoji } from "@/lib/constants";
import { ForecastForm } from "./forecast-form";
import { CommentSection } from "./comment-section";
import { DisputeForm } from "@/components/dispute-form";
import { Users, CheckCircle, XCircle, ArrowLeft, TrendingUp, Clock } from "lucide-react";
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
  const consensusPct = consensus !== null ? Math.round(consensus * 100) : null;
  const emoji = getQuestionEmoji(question.title, question.category);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Back button */}
      <Link href="/questions" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        All Markets
      </Link>

      {/* Hero card */}
      <Card className="overflow-hidden border-primary/20">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start gap-4">
            {/* Emoji icon */}
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 text-2xl ${CATEGORY_COLORS[question.category] || CATEGORY_COLORS.OTHER}`}>
              {emoji}
            </div>

            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[question.category] || question.category}</Badge>
                {question.status === "RESOLVED" && (
                  <Badge variant={question.resolved_outcome ? "default" : "secondary"} className="gap-1">
                    {question.resolved_outcome ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {question.resolved_outcome ? "Resolved YES" : "Resolved NO"}
                  </Badge>
                )}
                {question.status === "CLOSED" && <Badge variant="secondary">Awaiting Resolution</Badge>}
                {isOpen && (
                  <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
                    <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" /></span>
                    Open
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-bold leading-tight">{question.title}</h1>

              {/* Meta row */}
              <div className="flex items-center gap-4 mt-2.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {forecastCount || 0} forecast{forecastCount !== 1 ? "s" : ""}
                </span>
                {isOpen && <CountdownTimer targetDate={question.close_time} />}
                {question.status === "CLOSED" && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Closed — awaiting resolution
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consensus + Your Forecast row */}
      {(consensusPct !== null || userForecast) && (
        <div className="grid grid-cols-2 gap-3">
          {consensusPct !== null && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Community</p>
                    <p className="text-2xl font-bold font-mono text-primary">{consensusPct}%</p>
                  </div>
                </div>
                {/* Consensus bar */}
                <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${consensusPct}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
          {userForecast && (
            <Card className={question.status === "RESOLVED" ? "border-primary/30" : ""}>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-primary">You</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Your Forecast</p>
                    <p className="text-2xl font-bold font-mono">{Math.round(userForecast.probability * 100)}%</p>
                  </div>
                </div>
                {question.status === "RESOLVED" && (
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Score</span>
                    <span className="font-mono font-bold text-primary">
                      {(brierPoints(userForecast.probability, question.resolved_outcome!) * 100).toFixed(1)} pts
                    </span>
                  </div>
                )}
                {/* Your forecast bar */}
                {question.status !== "RESOLVED" && (
                  <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-foreground/40 transition-all"
                      style={{ width: `${Math.round(userForecast.probability * 100)}%` }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {/* Fill empty slot if only one card shows */}
          {consensusPct !== null && !userForecast && <div />}
          {consensusPct === null && userForecast && <div />}
        </div>
      )}

      {/* Resolution result */}
      {question.status === "RESOLVED" && (
        <Card className={`overflow-hidden ${question.resolved_outcome ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
          <CardContent className="py-5">
            <div className="flex items-center gap-3">
              {question.resolved_outcome ? (
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
              <div>
                <p className="font-semibold text-lg">Resolved: {question.resolved_outcome ? "YES" : "NO"}</p>
                {question.resolved_at && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(question.resolved_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Forecast form */}
      {isOpen && user && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-blue-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Your Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <ForecastForm questionId={id} currentProbability={userForecast?.probability ?? null} />
          </CardContent>
        </Card>
      )}

      {isOpen && !user && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-3">Sign in to submit your forecast</p>
            <Link href="/signin" className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Sign in
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Description */}
      {question.description && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{question.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Dispute */}
      {question.status === "RESOLVED" && user && userForecast && (
        <div className="flex justify-end">
          <DisputeForm questionId={id} />
        </div>
      )}

      {/* Comments */}
      <Card>
        <CardContent className="pt-5">
          <CommentSection
            questionId={id}
            comments={comments}
            currentUserId={user?.id ?? null}
          />
        </CardContent>
      </Card>
    </div>
  );
}
