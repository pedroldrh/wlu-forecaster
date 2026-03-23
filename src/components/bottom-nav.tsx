"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, MonitorPlay } from "@phosphor-icons/react";
import { UserAvatar } from "@/components/user-avatar";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// Prefetch data so pages load instantly when tapped
let prefetched = false;
function prefetchPages(userId: string | null) {
  if (prefetched) return;
  prefetched = true;
  fetch("/api/leaderboard", { cache: "no-store" }).catch(() => {});
  if (userId) fetch(`/api/profile/${userId}`, { cache: "no-store" }).catch(() => {});
}

export function BottomNav() {
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    createClient().auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
      // Prefetch other pages in the background
      prefetchPages(user?.id ?? null);
    });
  }, []);

  if (!mounted || pathname === "/signin") return null;

  const isHome = pathname === "/";
  const isLeaderboard = pathname.startsWith("/leaderboard");
  const isProfile = pathname.startsWith("/u/");

  const profileHref = userId ? `/u/${userId}` : "/signin";

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-black">
      <div className="h-px bg-white/10" />
      <div className="flex items-end justify-around px-6 pt-2 pb-[max(env(safe-area-inset-bottom,8px),8px)]">
        <Link
          href="/leaderboard"
          className={`flex items-center justify-center w-12 h-10 transition-all ${
            isLeaderboard ? "text-white" : "text-white/50 active:text-white/70"
          }`}
        >
          <Trophy
            className="h-7 w-7"
            weight={isLeaderboard ? "fill" : "regular"}
          />
        </Link>

        <Link
          href="/"
          className={`flex items-center justify-center w-12 h-10 transition-all ${
            isHome ? "text-white" : "text-white/50 active:text-white/70"
          }`}
        >
          <MonitorPlay
            className="h-7 w-7"
            weight={isHome ? "fill" : "regular"}
          />
        </Link>

        <Link
          href={profileHref}
          className="flex items-center justify-center w-12 h-10 transition-all"
        >
          {userId ? (
            <div className={`rounded-full transition-all ${isProfile ? "ring-2 ring-white scale-110" : ""}`}>
              <UserAvatar userId={userId} size="sm" />
            </div>
          ) : (
            <div className={`h-7 w-7 rounded-full transition-all ${isProfile ? "bg-white/40 ring-2 ring-white" : "bg-white/30"}`} />
          )}
        </Link>
      </div>
    </nav>
  );
}
