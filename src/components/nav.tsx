"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BarChart3, User, LogOut, Shield, TrendingUp, Download, X, Share } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { brierPoints } from "@/lib/scoring";
import { NavigationProgress } from "@/components/navigation-progress";
import { useUnvotedCount } from "@/hooks/use-unvoted-count";

export function Nav() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [installOpen, setInstallOpen] = useState(false);
  const [userStats, setUserStats] = useState<{ score: number; forecasts: number; resolved: number } | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const unvotedCount = useUnvotedCount();

  async function fetchUserStats(userId: string) {
    // Get live season
    const { data: season } = await supabase
      .from("seasons")
      .select("id")
      .eq("status", "LIVE")
      .single();
    if (!season) { setUserStats(null); return; }

    // Get user's forecasts for this season's questions
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push("/");
    router.refresh();
  };

  const links = [
    { href: "/", label: "Home" },
    { href: "/questions", label: "Markets" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/how-it-works", label: "How It Works" },
  ];

  return (
    <nav className="relative border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 font-bold text-2xl">
            <BarChart3 className="h-8 w-8 text-primary" />
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Forecaster</span>
          </Link>
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
        </div>

        <div className="flex items-center gap-3">
          {userStats && (
            <div className="hidden sm:flex items-center gap-2 text-base font-medium text-primary">
              <TrendingUp className="h-5 w-5" />
              {userStats.resolved > 0 ? (
                <span>{userStats.score.toFixed(1)} pts</span>
              ) : (
                <span>{userStats.forecasts} forecast{userStats.forecasts !== 1 ? "s" : ""}</span>
              )}
            </div>
          )}

          <button
            onClick={() => setInstallOpen(true)}
            className="inline-flex items-center justify-center h-10 w-10 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors md:hidden"
          >
            <Download className="h-5 w-5" />
          </button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 text-base h-10 px-3">
                  <UserAvatar avatarUrl={profile?.avatar_url} userId={user.id} size="sm" />
                  <span className="hidden sm:inline">{profile?.name || "Account"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/u/${user.id}`}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                {profile?.role === "ADMIN" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild className="text-base h-10 px-5">
              <Link href="/signin">Sign in</Link>
            </Button>
          )}
        </div>
      </div>

      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>

      {installOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setInstallOpen(false)}>
          <div className="max-w-md w-full rounded-xl border bg-background shadow-lg p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <p className="font-semibold">Install Forecaster as an App</p>
              <button onClick={() => setInstallOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">On iPhone (Safari):</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Tap the <Share className="inline h-4 w-4 -mt-0.5" /> <strong className="text-foreground">Share</strong> button</li>
                <li>Scroll down and tap <strong className="text-foreground">&quot;Add to Home Screen&quot;</strong></li>
                <li>Tap <strong className="text-foreground">&quot;Add&quot;</strong> to confirm</li>
              </ol>
              <p className="font-medium text-foreground pt-2">On Android (Chrome):</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Tap the <strong className="text-foreground">menu (&#8942;)</strong> in your browser</li>
                <li>Tap <strong className="text-foreground">&quot;Add to Home Screen&quot;</strong> or <strong className="text-foreground">&quot;Install App&quot;</strong></li>
                <li>Tap <strong className="text-foreground">&quot;Install&quot;</strong> to confirm</li>
              </ol>
            </div>
            <Button className="w-full mt-4" onClick={() => setInstallOpen(false)}>
              Got it
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
