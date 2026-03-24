"use client";

import { useState, useEffect, use } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";
import { ReferralCard } from "@/components/referral-card";
import { SignOutButton } from "@/components/sign-out-button";
import { Crown, Shield, Bell, BellRinging, BellSlash, Info, Crosshair, Trophy, ChartLineUp, X, Fire } from "@phosphor-icons/react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { subscribeToPush } from "@/lib/push-utils";
import { savePushSubscription } from "@/actions/push-subscriptions";
import { toast } from "sonner";
import { useSwipeNav } from "@/lib/use-swipe-nav";
import { SwipePeek } from "@/components/swipe-peek";
import { SeasonRecapButton } from "@/components/season-recap";
import { UserTypeToggle } from "@/components/user-type-toggle";

const cache = new Map<string, any>();

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(cache.get(id) ?? null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(
    cache.get("__currentUserId__") ?? null
  );
  const [authChecked, setAuthChecked] = useState(!!cache.get("__currentUserId__"));
  const [notifStatus, setNotifStatus] = useState<"loading" | "granted" | "denied" | "prompt" | "unsupported">("loading");
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const { containerRef, swipeStyle, peekLabel } = useSwipeNav({
    rightHref: "/",
    rightLabel: "Feed",
  });

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      const uid = user?.id ?? null;
      setCurrentUserId(uid);
      cache.set("__currentUserId__", uid);
      setAuthChecked(true);
    });

    fetch(`/api/profile/${id}`, { cache: "no-store" }).then((r) => r.json()).then((d) => {
      cache.set(id, d);
      setData(d);
    });

    // Check notification status
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setNotifStatus("unsupported");
    } else {
      setNotifStatus(Notification.permission as "granted" | "denied" | "prompt");
    }
  }, [id]);

  async function handleEnableNotifications() {
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      try {
        const sub = await subscribeToPush();
        const json = sub.toJSON();
        await savePushSubscription({
          endpoint: json.endpoint!,
          keys: { p256dh: json.keys!.p256dh!, auth: json.keys!.auth! },
        });
        setNotifStatus("granted");
        toast.success("Notifications enabled!");
      } catch {
        setNotifStatus("prompt");
        toast.error("Something went wrong. Try again.");
      }
    } else if (perm === "denied") {
      setNotifStatus("denied");
    }
  }

  if (!data) return (
    <div ref={containerRef} className="relative">
      <SwipePeek label={peekLabel} />
      <div style={swipeStyle}>
        <div className="max-w-3xl mx-auto space-y-6 pb-24">
          <div className="rounded-2xl bg-white/5 animate-pulse pt-8 pb-6 px-6">
            <div className="flex flex-col items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-white/10 animate-pulse" />
              <div className="h-5 w-40 rounded bg-white/10 animate-pulse" />
              <div className="h-16 w-48 rounded bg-white/5 animate-pulse" />
              <div className="flex gap-6">
                <div className="h-10 w-16 rounded bg-white/5 animate-pulse" />
                <div className="h-10 w-16 rounded bg-white/5 animate-pulse" />
                <div className="h-10 w-16 rounded bg-white/5 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  if (data.error) return <div className="text-center py-12 text-muted-foreground">User not found.</div>;

  const profile = data.profile;
  const isOwnProfile = authChecked && currentUserId === id;
  const displayName = profile.display_name || profile.name || "Anonymous";
  const isFounder = profile.role === "ADMIN" && displayName === "Forecast Founder";
  const hasRecord = data.wins > 0 || data.losses > 0;

  return (
    <div ref={containerRef} className="relative">
      <SwipePeek label={peekLabel} />
      <div style={swipeStyle}>
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* Hero section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/15 via-background to-purple-500/10 border border-white/8 pt-8 pb-6 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-blue-500/10 rounded-full blur-3xl" />

        {/* Top-right action buttons */}
        {isOwnProfile && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
            {notifStatus === "prompt" && (
              <button
                onClick={handleEnableNotifications}
                className="h-9 w-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center active:scale-[0.85] transition-all duration-200"
              >
                <Bell className="h-4.5 w-4.5 text-white" />
              </button>
            )}
            {notifStatus === "granted" && (
              <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center">
                <BellRinging className="h-4.5 w-4.5 text-white/40" />
              </div>
            )}
            <button
              onClick={() => setShowHowItWorks(true)}
              className="h-9 w-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center active:scale-[0.85] transition-all duration-200"
            >
              <Info className="h-4.5 w-4.5 text-white" />
            </button>
          </div>
        )}

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
            {(data.badges ?? []).map((b: string) => (
              <Badge key={b} variant="secondary" className="text-xs">{b}</Badge>
            ))}
            <span className="text-xs text-muted-foreground">
              Joined {formatDate(new Date(profile.created_at))}
            </span>
          </div>

          {hasRecord ? (
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-6xl sm:text-7xl font-extrabold font-mono text-green-400 leading-none">{data.wins}</span>
              <span className="text-4xl sm:text-5xl font-bold text-white/20 leading-none">-</span>
              <span className="text-6xl sm:text-7xl font-extrabold font-mono text-red-400 leading-none">{data.losses}</span>
            </div>
          ) : (
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-5xl sm:text-6xl font-extrabold font-mono text-white/15 leading-none">0 - 0</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-3">
            {data.season ? `${data.season.name} Record` : "Record"}
          </p>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="text-center">
              <p className="font-bold font-mono text-foreground">{data.totalForecasts}</p>
              <p className="text-xs">Forecasts</p>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="text-center">
              <p className="font-bold font-mono text-foreground">{data.questionsPlayed}</p>
              <p className="text-xs">Resolved</p>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="text-center">
              <p className="font-bold font-mono text-foreground flex items-center justify-center gap-1">
                {data.streak?.current > 0 && <Fire className="h-4 w-4 text-orange-400" weight="fill" />}
                {data.streak?.current ?? 0}
              </p>
              <p className="text-xs">Day Streak</p>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="text-center">
              <p className="font-bold font-mono text-foreground">{data.seasonCount}</p>
              <p className="text-xs">Seasons</p>
            </div>
          </div>
        </div>
      </div>

      {isOwnProfile && <ReferralCard userId={id} referralCount={data.referrals} />}
      {isOwnProfile && data.totalForecasts > 0 && <SeasonRecapButton userId={id} />}

      {data.resolvedForecasts?.length > 0 && (
        <Card id="score-breakdown">
          <CardHeader>
            <CardTitle className="text-lg">Resolved Forecasts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-white/5">
              {data.resolvedForecasts.map((f: any, i: number) => (
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

      {data.allForecasts?.length > 0 && (
        <Card id="recent-forecasts">
          <CardHeader>
            <CardTitle className="text-lg">Recent Forecasts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-white/5">
              {data.allForecasts.slice(0, 20).map((f: any) => (
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

      {isOwnProfile && <UserTypeToggle />}

      {isOwnProfile && (
        <div className="space-y-3">
          {profile.role === "ADMIN" && (
            <Link href="/admin" className="flex items-center justify-center gap-2 w-full rounded-md border border-blue-500/30 bg-blue-500/5 px-4 py-2.5 text-sm font-medium text-blue-400 hover:bg-blue-500/10 active:scale-[0.98] transition-all">
              <Shield className="h-4 w-4" />
              Admin Dashboard
            </Link>
          )}
          <SignOutButton />
        </div>
      )}

    </div>
      </div>

      {/* How It Works modal — portaled to body to escape all stacking contexts */}
      {showHowItWorks && createPortal(
        <div
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center px-6"
          onClick={() => setShowHowItWorks(false)}
        >
          <div
            className="bg-zinc-900 rounded-2xl p-6 max-w-sm w-full space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-lg">How It Works</h3>
              <button
                onClick={() => setShowHowItWorks(false)}
                className="text-white/40 hover:text-white/70 active:scale-[0.85] transition-all duration-150"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                  <Crosshair className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-white">Swipe & Vote</p>
                  <p className="text-xs text-white/50">Swipe through markets and vote YES or NO on each prediction.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-lg bg-green-500/15 flex items-center justify-center shrink-0">
                  <ChartLineUp className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-white">Build Your Record</p>
                  <p className="text-xs text-white/50">Correct predictions earn a W, wrong ones an L. Your record shows on the leaderboard.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                  <Trophy className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-white">Win Real Money</p>
                  <p className="text-xs text-white/50">Vote on 15+ markets to qualify. Best record at the end of the season wins cash from the prize pool.</p>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
