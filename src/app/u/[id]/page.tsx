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
import { HowItWorksButton } from "@/components/how-it-works-button";
import { Crown, Shield, ShieldCheck } from "@phosphor-icons/react/ssr";
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

  let wins = 0;
  let losses = 0;
  let questionsPlayed = 0;
  let resolvedForecasts: { questionId: string; probability: number; outcome: boolean; title: string; correct: boolean }[] = [];
  if (season) {
    const { data: resolvedQuestions } = await supabase
      .from("questions")
      .select("id, title, resolved_outcome")
      .eq("season_id", season.id)
      .eq("status", "RESOLVED");

    const resolvedQs = resolvedQuestions ?? [];
    const resolvedQuestionIds = resolvedQs.map((q) => q.id);

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

      const record = winLossRecord(forCalc);
      wins = record.wins;
      losses = record.losses;
      questionsPlayed = (forecasts ?? []).length;
      resolvedForecasts = (forecasts ?? []).map((f) => {
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
  const qualifiesForPrizes = allForecasts.length >= 5;

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
  const isFounder = profile.role === "ADMIN" && displayName === "Forecast Founder";

  // Count referrals
  const { count: referralCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("referred_by", id);
  const referrals = referralCount ?? 0;

  const hasRecord = wins > 0 || losses > 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* Hero section — big record display */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-blue-500/10 border border-primary/20 pt-8 pb-6 px-6">
        {/* Decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/10 rounded-full blur-3xl" />

        <div className="relative flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative mb-4">
            <UserAvatar userId={id} size="lg" className="h-20 w-20 ring-4 ring-primary/20" />
            {isFounder && (
              <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-amber-500 flex items-center justify-center">
                <Crown className="h-3.5 w-3.5 text-white" weight="fill" />
              </div>
            )}
          </div>

          {/* Name */}
          <h1 className="text-xl font-bold mb-1">{displayName}</h1>

          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-5">
            {isFounder && (
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
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

          {/* Big record display */}
          {hasRecord ? (
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-6xl sm:text-7xl font-extrabold font-mono text-green-500 leading-none">
                {wins}
              </span>
              <span className="text-4xl sm:text-5xl font-bold text-muted-foreground/40 leading-none">
                -
              </span>
              <span className="text-6xl sm:text-7xl font-extrabold font-mono text-red-500 leading-none">
                {losses}
              </span>
            </div>
          ) : (
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-5xl sm:text-6xl font-extrabold font-mono text-muted-foreground/30 leading-none">
                0 - 0
              </span>
            </div>
          )}
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-3">
            {season ? `${season.name} Record` : "Record"}
          </p>

          {/* Quick stats row */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="text-center">
              <p className="font-bold font-mono text-foreground">{allForecasts.length}</p>
              <p className="text-xs">Forecasts</p>
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="text-center">
              <p className="font-bold font-mono text-foreground">{questionsPlayed}</p>
              <p className="text-xs">Resolved</p>
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="text-center">
              <p className="font-bold font-mono text-foreground">{entries.length}</p>
              <p className="text-xs">Seasons</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications + How It Works */}
      {isOwnProfile && (
        <div className="flex gap-3">
          <EnableNotificationsButton />
          <HowItWorksButton />
        </div>
      )}

      {/* Prize qualification */}
      {season && qualifiesForPrizes && (
        <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-3 text-sm">
          <ShieldCheck className="h-5 w-5 text-green-500 shrink-0" weight="fill" />
          <span className="font-medium">
            Qualifies for {season.name} prizes
          </span>
        </div>
      )}

      {/* Referral card (own profile only) */}
      {isOwnProfile && <ReferralCard userId={id} referralCount={referrals} />}

      {/* Score breakdown */}
      {resolvedForecasts.length > 0 && (
        <Card id="score-breakdown">
          <CardHeader>
            <CardTitle className="text-lg">Accuracy on Resolved Markets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {resolvedForecasts.map((f, i) => (
                <Link key={i} href={`/questions/${f.questionId}`} className="flex items-center justify-between py-3 hover:bg-muted/50 -mx-2 px-2 rounded-md transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Resolved {f.outcome ? "YES" : "NO"} · You voted {f.probability >= 0.5 ? "YES" : "NO"}
                    </p>
                  </div>
                  <div className="ml-4 shrink-0">
                    <Badge variant={f.correct ? "default" : "secondary"} className={f.correct ? "bg-green-500/15 text-green-500 border-green-500/30" : "bg-red-500/15 text-red-500 border-red-500/30"}>
                      {f.correct ? "Correct" : "Wrong"}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent forecasts */}
      {allForecasts.length > 0 && (
        <Card id="recent-forecasts">
          <CardHeader>
            <CardTitle className="text-lg">Recent Forecasts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {allForecasts.slice(0, 20).map((f) => (
                <Link key={f.id} href={`/questions/${f.question_id}`} className="flex items-center justify-between py-3 hover:bg-muted/50 -mx-2 px-2 rounded-md transition-colors">
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
                      <div className={`text-xs font-medium ${(f.probability >= 0.5) === f.question.resolved_outcome ? "text-green-500" : "text-red-500"}`}>
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
            <Link href="/admin" className="flex items-center justify-center gap-2 w-full rounded-md border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors">
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
