"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, MonitorPlay } from "@phosphor-icons/react";
import { UserAvatar } from "@/components/user-avatar";
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { hideFeed } from "@/lib/feed-visibility";

let prefetched = false;
function prefetchPages(userId: string | null) {
  if (prefetched) return;
  prefetched = true;
  fetch("/api/leaderboard", { cache: "no-store" }).catch(() => {});
  if (userId) fetch(`/api/profile/${userId}`, { cache: "no-store" }).catch(() => {});
}

const TABS = ["leaderboard", "home", "profile"] as const;
type Tab = (typeof TABS)[number];

function getActiveTab(pathname: string): Tab {
  if (pathname.startsWith("/leaderboard")) return "leaderboard";
  if (pathname.startsWith("/u/")) return "profile";
  return "home";
}

export function BottomNav() {
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [tapped, setTapped] = useState<Tab | null>(null);
  const [pillLeft, setPillLeft] = useState<number | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<Tab, HTMLAnchorElement>>(new Map());

  useEffect(() => {
    setMounted(true);
    createClient().auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
      prefetchPages(user?.id ?? null);
    });
  }, []);

  const active = getActiveTab(pathname);

  const measurePill = useCallback(() => {
    const tab = tabRefs.current.get(active);
    const nav = navRef.current;
    if (tab && nav) {
      const tabRect = tab.getBoundingClientRect();
      const navRect = nav.getBoundingClientRect();
      setPillLeft(tabRect.left - navRect.left + tabRect.width / 2 - 16);
    }
  }, [active]);

  useEffect(() => {
    measurePill();
    window.addEventListener("resize", measurePill);
    return () => window.removeEventListener("resize", measurePill);
  }, [measurePill]);

  if (!mounted || pathname === "/signin") return null;

  const profileHref = userId ? `/u/${userId}` : "/signin";

  const handleNavAway = () => {
    if (active === "home") hideFeed();
  };

  const handleTap = (tab: Tab) => {
    setTapped(tab);
    setTimeout(() => setTapped(null), 400);
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden">
      <div className="relative bg-black/90 backdrop-blur-xl">
        <div className="h-px bg-white/[0.06]" />

        <div
          ref={navRef}
          className="relative flex items-center justify-around px-6 pt-2.5 pb-[max(env(safe-area-inset-bottom,8px),8px)]"
        >
          {/* Sliding pill indicator */}
          {pillLeft !== null && (
            <div
              className="absolute top-0 h-[3px] rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              style={{
                width: 32,
                left: pillLeft,
                background: "linear-gradient(90deg, rgba(255,255,255,0.7), rgba(255,255,255,0.3))",
                boxShadow: "0 0 12px rgba(255,255,255,0.3), 0 0 4px rgba(255,255,255,0.2)",
              }}
            />
          )}

          {/* Leaderboard */}
          <Link
            href="/leaderboard"
            ref={(el) => { if (el) tabRefs.current.set("leaderboard", el); }}
            onClick={() => { handleNavAway(); handleTap("leaderboard"); }}
            className="relative flex flex-col items-center justify-center w-16 h-12 group"
          >
            <div
              className={`transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                active === "leaderboard"
                  ? "text-white scale-110"
                  : "text-white/40 group-active:scale-[0.6]"
              } ${tapped === "leaderboard" ? "animate-[nav-pop_400ms_ease-out]" : ""}`}
            >
              <Trophy
                className={`h-7 w-7 transition-all duration-300 ${
                  active === "leaderboard" ? "drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" : ""
                }`}
                weight={active === "leaderboard" ? "fill" : "regular"}
              />
            </div>
            <span
              className={`text-[10px] font-semibold mt-0.5 transition-all duration-300 ${
                active === "leaderboard"
                  ? "text-white/80 opacity-100 translate-y-0"
                  : "text-white/0 opacity-0 -translate-y-1"
              }`}
            >
              Ranks
            </span>
          </Link>

          {/* Feed */}
          <Link
            href="/"
            ref={(el) => { if (el) tabRefs.current.set("home", el); }}
            onClick={() => handleTap("home")}
            className="relative flex flex-col items-center justify-center w-16 h-12 group"
          >
            <div
              className={`transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                active === "home"
                  ? "text-white scale-110"
                  : "text-white/40 group-active:scale-[0.6]"
              } ${tapped === "home" ? "animate-[nav-pop_400ms_ease-out]" : ""}`}
            >
              <MonitorPlay
                className={`h-7 w-7 transition-all duration-300 ${
                  active === "home" ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" : ""
                }`}
                weight={active === "home" ? "fill" : "regular"}
              />
            </div>
            <span
              className={`text-[10px] font-semibold mt-0.5 transition-all duration-300 ${
                active === "home"
                  ? "text-white/80 opacity-100 translate-y-0"
                  : "text-white/0 opacity-0 -translate-y-1"
              }`}
            >
              Feed
            </span>
          </Link>

          {/* Profile */}
          <Link
            href={profileHref}
            ref={(el) => { if (el) tabRefs.current.set("profile", el); }}
            onClick={() => { handleNavAway(); handleTap("profile"); }}
            className="relative flex flex-col items-center justify-center w-16 h-12 group"
          >
            <div
              className={`transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                active === "profile"
                  ? "scale-110"
                  : "group-active:scale-[0.6]"
              } ${tapped === "profile" ? "animate-[nav-pop_400ms_ease-out]" : ""}`}
            >
              {userId ? (
                <div
                  className={`rounded-full transition-all duration-300 ${
                    active === "profile"
                      ? "ring-2 ring-white/70 shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                      : "opacity-50"
                  }`}
                >
                  <UserAvatar userId={userId} size="sm" />
                </div>
              ) : (
                <div
                  className={`h-7 w-7 rounded-full transition-all duration-300 ${
                    active === "profile"
                      ? "bg-white/50 ring-2 ring-white/70 shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                      : "bg-white/20"
                  }`}
                />
              )}
            </div>
            <span
              className={`text-[10px] font-semibold mt-0.5 transition-all duration-300 ${
                active === "profile"
                  ? "text-white/80 opacity-100 translate-y-0"
                  : "text-white/0 opacity-0 -translate-y-1"
              }`}
            >
              You
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
