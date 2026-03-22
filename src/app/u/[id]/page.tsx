"use client";

import { useState, useEffect, use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";
import { ReferralCard } from "@/components/referral-card";
import { EnableNotificationsButton } from "@/components/enable-notifications-button";
import { SignOutButton } from "@/components/sign-out-button";
import { Crown, Shield } from "@phosphor-icons/react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// In-memory cache per profile ID
const cache = new Map<string, any>();

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(cache.get(id) ?? null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });

    fetch(`/api/profile/${id}`, { cache: "no-store" }).then((r) => r.json()).then((d) => {
      cache.set(id, d);
      setData(d);
    });
  }, [id]);

  if (!data) return <div className="min-h-screen" />;
  if (data.error) return <div className="text-center py-12 text-muted-foreground">User not found.</div>;

  const profile = data.profile;
  const isOwnProfile = currentUserId === id;
  const displayName = profile.display_name || profile.name || "Anonymous";
  const isFounder = profile.role === "ADMIN" && displayName === "Forecast Founder";
  const hasRecord = data.wins > 0 || data.losses > 0;

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
              <p className="font-bold font-mono text-foreground">{data.seasonCount}</p>
              <p className="text-xs">Seasons</p>
            </div>
          </div>
        </div>
      </div>

      {isOwnProfile && <EnableNotificationsButton />}

      {isOwnProfile && <ReferralCard userId={id} referralCount={data.referrals} />}

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
