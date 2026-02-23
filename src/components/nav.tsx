"use client";

import Link from "next/link";
import { ChartBar } from "@phosphor-icons/react";
import { UserAvatar } from "@/components/user-avatar";
import { NotificationBell } from "@/components/notification-bell";
import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePathname } from "next/navigation";
import { brierPoints } from "@/lib/scoring";
import { NavigationProgress } from "@/components/navigation-progress";
import { useUnvotedCount } from "@/hooks/use-unvoted-count";

export function Nav() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userStats, setUserStats] = useState<{ score: number; forecasts: number; resolved: number } | null>(null);
  const pathname = usePathname();
  const supabase = createClient();
  const unvotedCount = useUnvotedCount();

  async function fetchUserStats(userId: string) {
    const { data: season } = await supabase
      .from("seasons")
      .select("id")
      .eq("status", "LIVE")
      .single();
    if (!season) { setUserStats(null); return; }

    const { data: questions } = await supabase
      .from("questions")
      .select("id, status, resolved_outcome")
      .eq("season_id", season.id);
    if (!questions || questions.length === 0) { setUserStats(null); return; }

    const questionIds = questions.map((q) => q.id);
    const { data: forecasts } = await supabase
      .from("forecasts")
      .select("question_id, probability")
      .eq("user_id", userId)
      .in("question_id", questionIds);

    const totalForecasts = forecasts?.length || 0;
    if (totalForecasts === 0) { setUserStats(null); return; }

    const resolvedMap = new Map(
      questions
        .filter((q) => q.status === "RESOLVED")
        .map((q) => [q.id, q.resolved_outcome])
    );

    let totalPoints = 0;
    let resolvedCount = 0;
    for (const f of forecasts || []) {
      const outcome = resolvedMap.get(f.question_id);
      if (outcome != null) {
        totalPoints += brierPoints(f.probability, outcome as boolean);
        resolvedCount++;
      }
    }

    const score = resolvedCount > 0 ? (totalPoints / resolvedCount) * 100 : 0;
    setUserStats({ score, forecasts: totalForecasts, resolved: resolvedCount });
  }

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        setProfile(data);
        fetchUserStats(user.id);
      }
    }
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        supabase.from("profiles").select("*").eq("id", session.user.id).single().then(({ data }) => setProfile(data));
        fetchUserStats(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setUserStats(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const links = [
    { href: "/", label: "Home" },
    { href: "/questions", label: "Markets" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/how-it-works", label: "How It Works" },
  ];

  if (pathname === "/signin") return null;

  return (
    <>
      <nav className="relative border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-7xl mx-auto px-4 h-14 md:h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 md:gap-3 font-bold text-xl md:text-2xl">
            <ChartBar className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Forecaster</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            {links.map((link) => {
              const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative text-base transition-colors ${isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {link.label}
                  {link.href === "/questions" && unvotedCount > 0 && (
                    <span className="absolute -top-1.5 -right-4 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white px-1">
                      {unvotedCount}
                    </span>
                  )}
                </Link>
              );
            })}
            {profile?.role === "ADMIN" && (
              <Link href="/admin" className={`text-base transition-colors ${pathname.startsWith("/admin") ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}>
                Admin
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
              <NotificationBell userId={user.id} />
              <Link href={`/u/${user.id}`} className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-accent active:bg-accent/80 transition-colors outline-none">
                <UserAvatar userId={user.id} size="sm" />
                {userStats && userStats.resolved > 0 ? (
                  <span className="text-sm font-bold font-mono text-primary">{userStats.score.toFixed(1)}</span>
                ) : userStats && userStats.forecasts > 0 ? (
                  <span className="text-xs text-muted-foreground">{userStats.forecasts} bet{userStats.forecasts !== 1 ? "s" : ""}</span>
                ) : null}
              </Link>
              </>
            ) : (
              <Link
                href="/signin"
                className="animate-shine-sweep relative inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-sm h-9 px-5 md:text-base md:h-10 md:px-6 shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all duration-200 overflow-hidden group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                <span className="relative">Sign in</span>
              </Link>
            )}
          </div>
        </div>

        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
      </nav>

    </>
  );
}
