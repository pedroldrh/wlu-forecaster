import { createClient, createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalibrationChart } from "@/components/calibration-chart";
import { seasonScore, brierPoints } from "@/lib/scoring";
import { formatPercent, formatDate } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";
import { SuggestQuestion } from "@/components/suggest-question";
import { ReferralCard } from "@/components/referral-card";
import { ScoreCard } from "@/components/score-card";
import { TrendingUp, Hash, Activity, Award } from "lucide-react";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createAdminClient();
  let user: { id: string } | null = null;
  try {
    const authClient = await createClient();
    const { data } = await authClient.auth.getUser();
    user = data.user;
  } catch {}

  // Fetch the profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  // Get season entries (PAID or JOINED)
  const { data: entriesRaw } = await supabase
    .from("season_entries")
    .select("*, seasons(*)")
    .eq("user_id", id)
    .in("status", ["PAID", "JOINED"]);

  const entries = entriesRaw ?? [];

  // Get current/latest season
  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .in("status", ["LIVE", "ENDED"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let score = 0;
  let questionsPlayed = 0;
  let resolvedForecasts: { probability: number; outcome: boolean; title: string; points: number }[] = [];
  let calibrationData: { probability: number; outcome: boolean }[] = [];

  if (season) {
    // Get resolved question IDs for this season
    const { data: resolvedQuestions } = await supabase
      .from("questions")
      .select("id, title, resolved_outcome")
      .eq("season_id", season.id)
      .eq("status", "RESOLVED");

    const resolvedQs = resolvedQuestions ?? [];
    const resolvedQuestionIds = resolvedQs.map((q) => q.id);

    // Get forecasts for this user on resolved questions
    if (resolvedQuestionIds.length > 0) {
      const { data: forecasts } = await supabase
        .from("forecasts")
        .select("id, probability, question_id, submitted_at")
        .eq("user_id", id)
        .in("question_id", resolvedQuestionIds)
        .order("submitted_at", { ascending: false });

      const questionMap = new Map(resolvedQs.map((q) => [q.id, q]));

      const forCalc = (forecasts ?? []).map((f) => {
        const q = questionMap.get(f.question_id)!;
        return {
          probability: f.probability,
          outcome: q.resolved_outcome as boolean,
        };
      });

      score = seasonScore(forCalc);
      questionsPlayed = (forecasts ?? []).length;
      calibrationData = forCalc;

      resolvedForecasts = (forecasts ?? []).map((f) => {
        const q = questionMap.get(f.question_id)!;
        return {
          probability: f.probability,
          outcome: q.resolved_outcome as boolean,
          title: q.title,
          points: brierPoints(f.probability, q.resolved_outcome as boolean),
        };
      });
    }
  }

  // Get all forecasts including unresolved for this season
  let allForecasts: { id: string; probability: number; question_id: string; submitted_at: string; question: { title: string; status: string; resolved_outcome: boolean | null } }[] = [];
  if (season) {
    const { data: allQuestions } = await supabase
      .from("questions")
      .select("id, title, status, resolved_outcome")
      .eq("season_id", season.id);

    const allQs = allQuestions ?? [];
    const allQuestionIds = allQs.map((q) => q.id);

    if (allQuestionIds.length > 0) {
      const { data: forecasts } = await supabase
        .from("forecasts")
        .select("id, probability, question_id, submitted_at")
        .eq("user_id", id)
        .in("question_id", allQuestionIds)
        .order("submitted_at", { ascending: false });

      const questionMap = new Map(allQs.map((q) => [q.id, q]));
      allForecasts = (forecasts ?? []).map((f) => {
        const q = questionMap.get(f.question_id)!;
        return {
          ...f,
          question: {
            title: q.title,
            status: q.status,
            resolved_outcome: q.resolved_outcome,
          },
        };
      });
    }
  }

  // Badges
  const badges: string[] = [];
  if (profile.is_wlu_verified) badges.push("W&L Verified");

  if (season) {
    const { count: totalResolved } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("season_id", season.id)
      .eq("status", "RESOLVED");

    if (totalResolved && totalResolved > 0 && questionsPlayed >= totalResolved * 0.9) {
      badges.push("Most Active");
    }
  }

  const isOwnProfile = user?.id === id;
  const displayName = profile.display_name || profile.name || "Anonymous";

  // Count referrals for this user
  const { count: referralCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("referred_by", id);
  const referrals = referralCount ?? 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile header */}
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-blue-500/5">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center gap-4">
            <UserAvatar userId={id} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold truncate">{displayName}</h1>
                {badges.map((b) => (
                  <Badge key={b} variant="secondary" className="shrink-0">{b}</Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Joined {formatDate(new Date(profile.created_at))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats grid */}
      {season && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ScoreCard score={score} hasBreakdown={resolvedForecasts.length > 0} />
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-blue-400 shrink-0" />
                <div>
                  <p className="text-2xl font-bold font-mono">{questionsPlayed}</p>
                  <p className="text-xs text-muted-foreground">Resolved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500 shrink-0" />
                <div>
                  <p className="text-2xl font-bold font-mono">{allForecasts.length}</p>
                  <p className="text-xs text-muted-foreground">Forecasts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500 shrink-0" />
                <div>
                  <p className="text-2xl font-bold font-mono">{entries.length}</p>
                  <p className="text-xs text-muted-foreground">Seasons</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Suggest a market (own profile only) */}
      {isOwnProfile && <SuggestQuestion />}

      {/* Referral card (own profile only) */}
      {isOwnProfile && <ReferralCard userId={id} referralCount={referrals} />}

      {/* Calibration chart */}
      {calibrationData.length >= 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Calibration</CardTitle>
          </CardHeader>
          <CardContent>
            <CalibrationChart forecasts={calibrationData} />
          </CardContent>
        </Card>
      )}

      {/* Score breakdown */}
      {resolvedForecasts.length > 0 && (
        <Card id="score-breakdown">
          <CardHeader>
            <CardTitle className="text-lg">Score Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {resolvedForecasts.map((f, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Resolved {f.outcome ? "YES" : "NO"} · You: {Math.round(f.probability * 100)}%
                    </p>
                  </div>
                  <div className="ml-4 shrink-0">
                    <Badge variant={f.points >= 0.75 ? "default" : "secondary"} className="font-mono">
                      {(f.points * 100).toFixed(1)} pts
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent forecasts */}
      {allForecasts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Forecasts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {allForecasts.slice(0, 20).map((f) => (
                <div key={f.id} className="flex items-center justify-between py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.question.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {f.question.status === "RESOLVED"
                        ? `Resolved ${f.question.resolved_outcome ? "YES" : "NO"}`
                        : f.question.status}
                    </p>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <div className="font-mono text-sm font-medium">{Math.round(f.probability * 100)}%</div>
                    {f.question.status === "RESOLVED" && (
                      <div className="text-xs font-mono text-muted-foreground">
                        {(brierPoints(f.probability, f.question.resolved_outcome!) * 100).toFixed(1)} pts
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
