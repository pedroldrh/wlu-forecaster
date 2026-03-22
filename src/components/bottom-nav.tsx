"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, PlayCircle } from "@phosphor-icons/react";
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
      <div className="flex items-center justify-around h-14">
        {/* Leaderboard */}
        <Link
          href="/leaderboard"
          className={`flex items-center justify-center flex-1 h-full transition-all ${
            isLeaderboard ? "text-white" : "text-white/40 active:text-white/60"
          }`}
        >
          <Trophy
            className={`h-7 w-7 transition-transform ${isLeaderboard ? "scale-110" : ""}`}
            weight={isLeaderboard ? "fill" : "regular"}
          />
        </Link>

        {/* Feed */}
        <Link
          href="/"
          className={`flex items-center justify-center flex-1 h-full transition-all ${
            isHome ? "text-white" : "text-white/40 active:text-white/60"
          }`}
        >
          <PlayCircle
            className={`h-7 w-7 transition-transform ${isHome ? "scale-110" : ""}`}
            weight={isHome ? "fill" : "regular"}
          />
        </Link>

        {/* Profile */}
        <Link
          href={profileHref}
          className={`flex items-center justify-center flex-1 h-full transition-all ${
            isProfile ? "text-white" : "text-white/40 active:text-white/60"
          }`}
        >
          {userId ? (
            <div className={`rounded-full transition-all ${isProfile ? "ring-2 ring-white scale-110" : "opacity-60"}`}>
              <UserAvatar userId={userId} size="sm" />
            </div>
          ) : (
            <div className="h-7 w-7 rounded-full bg-white/20" />
          )}
        </Link>
      </div>
    </nav>
  );
}
