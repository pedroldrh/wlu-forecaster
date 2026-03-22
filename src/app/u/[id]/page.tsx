import { createClient, createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { winLossRecord, isCorrect } from "@/lib/scoring";
import { formatDate } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";
import { ReferralCard } from "@/components/referral-card";
import { EnableNotificationsButton } from "@/components/enable-notifications-button";
import { SignOutButton } from "@/components/sign-out-button";
import { Crown, Shield } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createAdminClient();
  const { data: profile } = await supabase.from("profiles").select("name, display_name").eq("id", id).single();
  if (!profile) return { title: "User Not Found" };

  const name = profile.display_name || profile.name || "Anonymous";
  return {
    title: `${name} — Forecaster`,
    description: `${name}'s forecasting profile on Forecaster`,
    openGraph: {
      title: `${name} — Forecaster`,
      description: `${name}'s forecasting profile on Forecaster`,
    },
  };
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createAdminClient();

  const [userResult, profileResult, seasonResult, entriesResult, referralResult] = await Promise.all([
    (async () => {
      try {
        const authClient = await createClient();
        const { data } = await authClient.auth.getUser();
        return data.user;
      } catch {
        return null;
      }
    })(),
    supabase.from("profiles").select("*").eq("id", id).single(),
    supabase
      .from("seasons")
      .select("*")
      .in("status", ["LIVE", "ENDED"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("season_entries")
      .select("*, seasons(*)")
      .eq("user_id", id)
      .in("status", ["PAID", "JOINED"]),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("referred_by", id),
  ]);

  const user = userResult;
  const profile = profileResult.data;
  if (!profile) notFound();

  const season = seasonResult.data;
  const entries = entriesResult.data ?? [];
  const referrals = referralResult.count ?? 0;

  let wins = 0;
  let losses = 0;
  let questionsPlayed = 0;
  let resolvedForecasts: { questionId: string; probability: number; outcome: boolean; title: string; correct: boolean }[] = [];
  let allForecasts: { id: string; probability: number; question_id: string; submitted_at: string; question: { title: string; status: string; resolved_outcome: boolean | null } }[] = [];
  let totalResolved = 0;

  if (season) {
    const [allQuestionsResult, userForecastsResult] = await Promise.all([
      supabase
        .from("questions")
        .select("id, title, status, resolved_outcome")
        .eq("season_id", season.id),
      supabase
        .from("forecasts")
        .select("id, probability, question_id, submitted_at")
        .eq("user_id", id)
        .order("submitted_at", { ascending: false }),
    ]);

    const allQs = allQuestionsResult.data ?? [];
    const allQuestionIds = new Set(allQs.map((q) => q.id));
    const questionMap = new Map(allQs.map((q) => [q.id, q]));

    const resolvedQs = allQs.filter((q) => q.status === "RESOLVED");
    totalResolved = resolvedQs.length;
    const resolvedIds = new Set(resolvedQs.map((q) => q.id));

    const seasonForecasts = (userForecastsResult.data ?? []).filter((f) => allQuestionIds.has(f.question_id));

    allForecasts = seasonForecasts.map((f) => {
      const q = questionMap.get(f.question_id)!;
      return {
        ...f,
        question: { title: q.title, status: q.status, resolved_outcome: q.resolved_outcome },
      };
    });

    const resolvedUserForecasts = seasonForecasts.filter((f) => resolvedIds.has(f.question_id));
    const forCalc = resolvedUserForecasts.map((f) => {
      const q = questionMap.get(f.question_id)!;
      return { probability: f.probability, outcome: q.resolved_outcome as boolean };
    });

    const record = winLossRecord(forCalc);
    wins = record.wins;
    losses = record.losses;
    questionsPlayed = resolvedUserForecasts.length;

    resolvedForecasts = resolvedUserForecasts.map((f) => {
      const q = questionMap.get(f.question_id)!;
      return {
        questionId: f.question_id,
        probability: f.probability,
        outcome: q.resolved_outcome as boolean,
        title: q.title,
        correct: isCorrect(f.probability, q.resolved_outcome as boolean),
      };
    });
  }

  const badges: string[] = [];
  if (profile.is_wlu_verified) badges.push("W&L Verified");
  if (totalResolved > 0 && questionsPlayed >= totalResolved * 0.9) badges.push("Most Active");

  const isOwnProfile = user?.id === id;
  const displayName = profile.display_name || profile.name || "Anonymous";
  const isFounder = profile.role === "ADMIN" && displayName === "Forecast Founder";
  const hasRecord = wins > 0 || losses > 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* Hero section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/15 via-background to-purple-500/10 border border-white/8 pt-8 pb-6 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative flex flex-col items-center text-center">
          <div className="relative mb-4">
            <UserAvatar userId={id} size="lg" className="h-20 w-20 ring-4 ring-blue-500/20" />
            {isFounder && (
              <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-amber-500 flex items-center justify-center">
                <Crown className="h-3.5 w-3.5 text-white" weight="fill" />
              </div>
            )}
          </div>

          <h1 className="text-xl font-bold mb-1">{displayName}</h1>

          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-5">
            {isFounder && (
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">
                Forecaster Founder
              </Badge>
            )}
            {badges.map((b) => (
              <Badge key={b} variant="secondary" className="text-xs">{b}</Badge>
            ))}
            <span className="text-xs text-muted-foreground">
              Joined {formatDate(new Date(profile.created_at))}
            </span>
          </div>

          {hasRecord ? (
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-6xl sm:text-7xl font-extrabold font-mono text-green-400 leading-none">{wins}</span>
              <span className="text-4xl sm:text-5xl font-bold text-white/20 leading-none">-</span>
              <span className="text-6xl sm:text-7xl font-extrabold font-mono text-red-400 leading-none">{losses}</span>
            </div>
          ) : (
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-5xl sm:text-6xl font-extrabold font-mono text-white/15 leading-none">0 - 0</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-3">
            {season ? `${season.name} Record` : "Record"}
          </p>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="text-center">
              <p className="font-bold font-mono text-foreground">{allForecasts.length}</p>
              <p className="text-xs">Forecasts</p>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="text-center">
              <p className="font-bold font-mono text-foreground">{questionsPlayed}</p>
              <p className="text-xs">Resolved</p>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="text-center">
              <p className="font-bold font-mono text-foreground">{entries.length}</p>
              <p className="text-xs">Seasons</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications (own profile only) */}
      {isOwnProfile && <EnableNotificationsButton />}

      {/* Referral card (own profile only) */}
      {isOwnProfile && <ReferralCard userId={id} referralCount={referrals} />}

      {/* Resolved Forecasts */}
      {resolvedForecasts.length > 0 && (
        <Card id="score-breakdown">
          <CardHeader>
            <CardTitle className="text-lg">Resolved Forecasts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-white/5">
              {resolvedForecasts.map((f, i) => (
                <Link key={i} href={`/questions/${f.questionId}`} className="flex items-center justify-between py-3 hover:bg-white/5 -mx-2 px-2 rounded-md transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Resolved {f.outcome ? "YES" : "NO"} · You voted {f.probability >= 0.5 ? "YES" : "NO"}
                    </p>
                  </div>
                  <div className="ml-4 shrink-0">
                    <Badge variant="secondary" className={f.correct ? "bg-green-500/15 text-green-400 border-green-500/30" : "bg-red-500/15 text-red-400 border-red-500/30"}>
                      {f.correct ? "Correct" : "Wrong"}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Forecasts */}
      {allForecasts.length > 0 && (
        <Card id="recent-forecasts">
          <CardHeader>
            <CardTitle className="text-lg">Recent Forecasts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-white/5">
              {allForecasts.slice(0, 20).map((f) => (
                <Link key={f.id} href={`/questions/${f.question_id}`} className="flex items-center justify-between py-3 hover:bg-white/5 -mx-2 px-2 rounded-md transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.question.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {f.question.status === "RESOLVED"
                        ? `Resolved ${f.question.resolved_outcome ? "YES" : "NO"}`
                        : f.question.status}
                    </p>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <div className="font-mono text-sm font-medium">{f.probability >= 0.5 ? "YES" : "NO"}</div>
                    {f.question.status === "RESOLVED" && f.question.resolved_outcome !== null && (
                      <div className={`text-xs font-medium ${(f.probability >= 0.5) === f.question.resolved_outcome ? "text-green-400" : "text-red-400"}`}>
                        {(f.probability >= 0.5) === f.question.resolved_outcome ? "Correct" : "Wrong"}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Own profile actions */}
      {isOwnProfile && (
        <div className="space-y-3">
          {profile.role === "ADMIN" && (
            <Link href="/admin" className="flex items-center justify-center gap-2 w-full rounded-md border border-blue-500/30 bg-blue-500/5 px-4 py-2.5 text-sm font-medium text-blue-400 hover:bg-blue-500/10 transition-colors">
              <Shield className="h-4 w-4" />
              Admin Dashboard
            </Link>
          )}
          <SignOutButton />
        </div>
      )}
    </div>
  );
}
