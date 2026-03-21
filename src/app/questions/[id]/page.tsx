import { createClient, createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CountdownTimer } from "@/components/countdown-timer";
import { CATEGORY_LABELS, getQuestionEmoji } from "@/lib/constants";
import { ForecastForm } from "./forecast-form";
import { CommentSection } from "./comment-section";
import { DisputeForm } from "@/components/dispute-form";
import { UsersThree, CheckCircle, XCircle, ArrowLeft, Clock } from "@phosphor-icons/react/ssr";
import { isCorrect } from "@/lib/scoring";
import Link from "next/link";
import type { Metadata } from "next";
import { ShareButton } from "@/components/share-button";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createAdminClient();
  const { data: question } = await supabase.from("questions").select("title, description, status, resolved_outcome").eq("id", id).single();
  if (!question) return { title: "Market Not Found" };

  // Fetch forecast count + consensus for the description
  const { data: forecasts } = await supabase
    .from("forecasts")
    .select("probability")
    .eq("question_id", id);
  const forecastCount = forecasts?.length ?? 0;
  let consensus: number | null = null;
  if (forecastCount > 0) {
    const sum = forecasts!.reduce((s, f) => s + f.probability, 0);
    consensus = Math.round((sum / forecastCount) * 100);
  }

  let description: string;
  if (question.status === "RESOLVED") {
    description = `Resolved ${question.resolved_outcome ? "YES" : "NO"}. ${forecastCount} forecaster${forecastCount !== 1 ? "s" : ""} predicted this market on Forecaster.`;
  } else if (consensus !== null) {
    description = `${consensus}% consensus from ${forecastCount} forecaster${forecastCount !== 1 ? "s" : ""}. Make your prediction on Forecaster — W&L's free forecasting game.`;
  } else {
    description = `Be the first to predict. Forecaster — W&L's free campus forecasting game with real prizes.`;
  }

  return {
    title: `${question.title} — Forecaster`,
    description,
    openGraph: {
      title: question.title,
      description,
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

export default async function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createAdminClient();
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  const { data: question } = await supabase.from("questions").select("*").eq("id", id).single();
  if (!question) notFound();

  // Get forecast count
  const { count: forecastCount } = await supabase
    .from("forecasts")
    .select("*", { count: "exact", head: true })
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

  // Get comments (no FK join — comments.user_id -> auth.users, not profiles)
  const { data: rawComments } = await supabase
    .from("comments")
    .select("id, content, created_at, user_id")
    .eq("question_id", id)
    .order("created_at", { ascending: false });

  // Fetch profiles for comment authors
  const commentUserIds = [...new Set((rawComments ?? []).map((c) => c.user_id))];
  const profileMap = new Map<string, { name: string | null; display_name: string | null; avatar_url: string | null }>();
  if (commentUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, display_name, avatar_url")
      .in("id", commentUserIds);
    for (const p of profiles ?? []) {
      profileMap.set(p.id, { name: p.name, display_name: p.display_name, avatar_url: p.avatar_url });
    }
  }

  const comments = (rawComments || []).map((c: any) => ({
    id: c.id,
    content: c.content,
    created_at: c.created_at,
    user_id: c.user_id,
    profile: profileMap.get(c.user_id) ?? null,
  }));

  const isOpen = question.status === "OPEN" && new Date() < new Date(question.close_time);
  const emoji = getQuestionEmoji(question.title, question.category);

  // Pre-compute correctness for resolved markets
  const wasCorrect = userForecast && question.status === "RESOLVED" && question.resolved_outcome !== null
    ? isCorrect(userForecast.probability, question.resolved_outcome!)
    : null;

  // Sidebar content shared between mobile and desktop positions
  const sidebarContent = (
    <>
      {/* Forecast form */}
      {isOpen && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Your Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <ForecastForm
              questionId={id}
              currentVote={userForecast ? userForecast.probability >= 0.5 : null}
              redirectTo={!user ? `/questions/${id}` : undefined}
            />
          </CardContent>
        </Card>
      )}

      {/* Dispute — top of resolved sidebar */}
      {question.status === "RESOLVED" && user && userForecast && (
        <DisputeForm questionId={id} />
      )}

      {/* Your prediction result */}
      {userForecast && (
        <Card className={question.status === "RESOLVED" ? "border-primary/20" : ""}>
          <CardContent className="py-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Your Vote</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">
                {userForecast.probability >= 0.5 ? "YES" : "NO"}
              </p>
              {wasCorrect !== null && (
                <Badge className={wasCorrect ? "bg-green-500/15 text-green-500 hover:bg-green-500/20 border-green-500/30" : "bg-red-500/15 text-red-500 hover:bg-red-500/20 border-red-500/30"}>
                  {wasCorrect ? "Correct!" : "Wrong"}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resolution result */}
      {question.status === "RESOLVED" && (
        <div className={`rounded-xl p-5 ${question.resolved_outcome ? "bg-green-500/10 ring-1 ring-green-500/20" : "bg-red-500/10 ring-1 ring-red-500/20"}`}>
          <div className="flex items-center gap-3">
            {question.resolved_outcome ? (
              <div className="h-11 w-11 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                <CheckCircle className="h-6 w-6 text-green-500" weight="fill" />
              </div>
            ) : (
              <div className="h-11 w-11 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                <XCircle className="h-6 w-6 text-red-500" weight="fill" />
              </div>
            )}
            <div>
              <p className="text-lg font-bold">
                Resolved {question.resolved_outcome ? "YES" : "NO"}
              </p>
              {question.resolved_at && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(question.resolved_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

    </>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back navigation + share */}
      <div className="flex items-center justify-between">
        <Link href="/questions" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          All Markets
        </Link>
        <ShareButton title={question.title} url={`https://wluforcaster.com/questions/${id}`} />
      </div>

      {/* Hero header */}
      <div>
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <Badge variant="outline" className="gap-1.5 text-xs">
            <span>{emoji}</span>
            {CATEGORY_LABELS[question.category] || question.category}
          </Badge>
          {question.status === "RESOLVED" && (
            <Badge variant={question.resolved_outcome ? "default" : "secondary"} className="gap-1">
              {question.resolved_outcome ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              Resolved {question.resolved_outcome ? "YES" : "NO"}
            </Badge>
          )}
          {question.status === "CLOSED" && (
            <Badge variant="secondary">Awaiting Resolution</Badge>
          )}
          {isOpen && (
            <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
              </span>
              Open
            </Badge>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight">{question.title}</h1>

        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <UsersThree className="h-4 w-4" />
            {forecastCount || 0} forecast{forecastCount !== 1 ? "s" : ""}
          </span>
          {isOpen && <CountdownTimer targetDate={question.close_time} />}
          {question.status === "CLOSED" && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Closed
            </span>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:items-start">
        {/* Main column */}
        <div className="space-y-8 min-w-0">
          {/* Sidebar on mobile */}
          <div className="lg:hidden space-y-4">
            {sidebarContent}
          </div>

          {/* Description */}
          {question.description && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">Description</h2>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{question.description}</p>
            </div>
          )}

          {/* Comments */}
          <CommentSection
            questionId={id}
            comments={comments}
            currentUserId={user?.id ?? null}
          />
        </div>

        {/* Sidebar on desktop */}
        <div className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            {sidebarContent}
          </div>
        </div>
      </div>
    </div>
  );
}
