"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlayCircle, Trophy } from "@phosphor-icons/react";
import { UserAvatar } from "@/components/user-avatar";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function BottomNav() {
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    createClient().auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
  }, []);

  if (!mounted || pathname === "/signin") return null;

  const isHome = pathname === "/";
  const isLeaderboard = pathname.startsWith("/leaderboard");
  const isProfile = pathname.startsWith("/u/");

  const profileHref = userId ? `/u/${userId}` : "/signin";

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden pb-[env(safe-area-inset-bottom,0px)]">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl border-t border-white/10" />

      <div className="relative flex items-center justify-around h-16">
        {/* Feed tab */}
        <Link
          href="/"
          className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all ${
            isHome ? "text-white" : "text-white/40 active:text-white/60"
          }`}
        >
          {isHome && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-white" />
          )}
          <PlayCircle
            className={`h-6 w-6 transition-transform ${isHome ? "scale-110" : ""}`}
            weight={isHome ? "fill" : "regular"}
          />
          <span className={`text-[10px] leading-none ${isHome ? "font-semibold" : "font-medium"}`}>
            Feed
          </span>
        </Link>

        {/* Leaderboard tab */}
        <Link
          href="/leaderboard"
          className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all ${
            isLeaderboard ? "text-white" : "text-white/40 active:text-white/60"
          }`}
        >
          {isLeaderboard && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-white" />
          )}
          <Trophy
            className={`h-6 w-6 transition-transform ${isLeaderboard ? "scale-110" : ""}`}
            weight={isLeaderboard ? "fill" : "regular"}
          />
          <span className={`text-[10px] leading-none ${isLeaderboard ? "font-semibold" : "font-medium"}`}>
            Board
          </span>
        </Link>

        {/* Profile tab with actual avatar */}
        <Link
          href={profileHref}
          className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all ${
            isProfile ? "text-white" : "text-white/40 active:text-white/60"
          }`}
        >
          {isProfile && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-white" />
          )}
          {userId ? (
            <div className={`rounded-full transition-all ${isProfile ? "ring-2 ring-white scale-110" : "ring-1 ring-white/30"}`}>
              <UserAvatar userId={userId} size="xs" />
            </div>
          ) : (
            <div className="h-5 w-5 rounded-full bg-white/20 ring-1 ring-white/30" />
          )}
          <span className={`text-[10px] leading-none ${isProfile ? "font-semibold" : "font-medium"}`}>
            Profile
          </span>
        </Link>
      </div>
    </nav>
  );
}
