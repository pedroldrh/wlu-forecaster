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
import { BarChart3, Menu, X, User, LogOut, Shield, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { brierPoints } from "@/lib/scoring";

export function Nav() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userStats, setUserStats] = useState<{ score: number; forecasts: number; resolved: number } | null>(null);
  const router = useRouter();
  const supabase = createClient();

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
    { href: "/questions", label: "Questions" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/how-it-works", label: "How It Works" },
  ];

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <BarChart3 className="h-5 w-5" />
            Forecaster
          </Link>
          <div className="hidden md:flex items-center gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {profile?.role === "ADMIN" && (
              <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Admin
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {userStats && (
            <div className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              {userStats.resolved > 0 ? (
                <span>{userStats.score.toFixed(1)} pts</span>
              ) : (
                <span>{userStats.forecasts} forecast{userStats.forecasts !== 1 ? "s" : ""}</span>
              )}
            </div>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-6 w-6 rounded-full" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
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
            <Button size="sm" asChild>
              <Link href="/signin">Sign in</Link>
            </Button>
          )}

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t px-4 py-3 space-y-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="block text-sm py-1 text-muted-foreground hover:text-foreground">
              {link.label}
            </Link>
          ))}
          {profile?.role === "ADMIN" && (
            <Link href="/admin" onClick={() => setMobileOpen(false)} className="block text-sm py-1 text-muted-foreground hover:text-foreground">
              Admin
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
