"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { submitForecast } from "@/actions/forecasts";
import { CATEGORY_LABELS, getQuestionEmoji } from "@/lib/constants";
import { Trophy, Info, X, CheckCircle, Fire } from "@phosphor-icons/react";
import { toast } from "sonner";
import Link from "next/link";
import { formatDollars } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { hideFeed, showFeed } from "@/lib/feed-visibility";
import { useSwipeNav } from "@/lib/use-swipe-nav";
import { SwipePeek } from "@/components/swipe-peek";
import { computeStreak } from "@/lib/streaks";
import { ActivityTicker } from "@/components/activity-ticker";
import { getCachedUserType } from "@/components/user-type-gate";

interface Market {
  id: string;
  title: string;
  category: string;
  description: string | null;
  imageUrl: string | null;
  voteCount: number;
  yesCount: number;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  SPORTS: "from-blue-900/90 to-blue-600/40",
  CAMPUS: "from-purple-900/90 to-purple-600/40",
  ACADEMICS: "from-amber-900/90 to-amber-600/40",
  GREEK: "from-emerald-900/90 to-emerald-600/40",
  LAW_SCHOOL: "from-red-900/90 to-red-600/40",
  OTHER: "from-zinc-900/90 to-zinc-600/40",
};

let cachedMarkets: Market[] | null = null;
let cachedSeasonInfo: { name: string; totalPrizeCents: number } | null = null;
let cachedVotedIds: Set<string> = new Set();
let cachedIsLoggedIn = false;
let cachedScrollMarketId: string | null = null;
let cachedUserId: string | null = null;
let cachedStreakBefore: number = 0;
let cachedVotedTodayBefore: boolean = false;
let cachedActivity: { userId: string; displayName: string; questionTitle: string }[] = [];
let cachedCategoryFilter: string | null = null;

export function SwipeFeed() {
  const [markets, setMarkets] = useState<Market[]>(cachedMarkets ?? []);
  const [loading, setLoading] = useState(cachedMarkets === null);
  const [seasonInfo, setSeasonInfo] = useState(cachedSeasonInfo);
  const [isLoggedIn, setIsLoggedIn] = useState(cachedIsLoggedIn);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [votedIds, setVotedIds] = useState<Set<string>>(cachedVotedIds);
  const [confirmedVote, setConfirmedVote] = useState<{ marketId: string; vote: boolean } | null>(null);
  const [consensus, setConsensus] = useState<{ marketId: string; yesPct: number; vote: boolean } | null>(null);
  const [showResolution, setShowResolution] = useState<string | null>(null);
  const [streakToast, setStreakToast] = useState<number | null>(null);
  const [activity, setActivity] = useState(cachedActivity);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(cachedCategoryFilter);
  const hadVotedTodayRef = useRef(cachedVotedTodayBefore);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const profileHref = cachedUserId ? `/u/${cachedUserId}` : "/signin";
  const { containerRef: feedRootRef, swipeStyle, peekLabel, reset: resetSwipe } = useSwipeNav({
    rightHref: "/leaderboard",
    leftHref: profileHref,
    rightLabel: "Leaderboard",
    leftLabel: "Profile",
    onNavigate: hideFeed,
  });

  const feed = useMemo(() => {
    const userType = getCachedUserType();
    return markets.filter((m) => {
      if (votedIds.has(m.id)) return false;
      if (categoryFilter && m.category !== categoryFilter) return false;
      // User type filtering: LAW sees only LAW_SCHOOL, UNDERGRAD sees everything except LAW_SCHOOL
      if (userType === "LAW" && m.category !== "LAW_SCHOOL") return false;
      if (userType === "UNDERGRAD" && m.category === "LAW_SCHOOL") return false;
      return true;
    });
  }, [markets, votedIds, categoryFilter]);

  // Categories that have unvoted markets (for showing chip counts)
  const availableCategories = useMemo(() => {
    const userType = getCachedUserType();
    const unvoted = markets.filter((m) => {
      if (votedIds.has(m.id)) return false;
      if (userType === "LAW" && m.category !== "LAW_SCHOOL") return false;
      if (userType === "UNDERGRAD" && m.category === "LAW_SCHOOL") return false;
      return true;
    });
    const counts = new Map<string, number>();
    for (const m of unvoted) {
      counts.set(m.category, (counts.get(m.category) || 0) + 1);
    }
    return counts;
  }, [markets, votedIds]);

  // Listen for reshuffle event (triggered by tapping feed icon while on feed)
  useEffect(() => {
    const handleReshuffle = () => {
      if (!cachedMarkets || cachedMarkets.length === 0) return;
      // Fisher-Yates shuffle
      const shuffled = [...cachedMarkets];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      cachedMarkets = shuffled;
      cachedScrollMarketId = null;
      setMarkets(shuffled);
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    };
    window.addEventListener("reshuffle-feed", handleReshuffle);
    return () => window.removeEventListener("reshuffle-feed", handleReshuffle);
  }, []);

  const handleCategoryChange = (cat: string | null) => {
    cachedCategoryFilter = cat;
    setCategoryFilter(cat);
    // Scroll to top when changing filter
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  // Track which card is currently visible so we can restore position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || feed.length === 0) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        // Find which card is most visible
        const containerRect = container.getBoundingClientRect();
        const centerY = containerRect.top + containerRect.height / 2;
        let closestId: string | null = null;
        let closestDist = Infinity;
        for (const [id, el] of cardRefs.current) {
          const rect = el.getBoundingClientRect();
          const cardCenter = rect.top + rect.height / 2;
          const dist = Math.abs(cardCenter - centerY);
          if (dist < closestDist) {
            closestDist = dist;
            closestId = id;
          }
        }
        if (closestId) cachedScrollMarketId = closestId;
        ticking = false;
      });
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [feed]);

  // Restore feed visibility and scroll position when returning to /
  useEffect(() => {
    if (pathname === "/") {
      showFeed();
      resetSwipe();
      // Restore scroll to the card user was viewing
      if (cachedScrollMarketId) {
        requestAnimationFrame(() => {
          const el = cardRefs.current.get(cachedScrollMarketId!);
          if (el) el.scrollIntoView({ behavior: "instant" as ScrollBehavior });
        });
      }
    }
  }, [pathname, resetSwipe]);

  const loadFeed = useCallback(async () => {
    try {
      const res = await fetch("/api/feed", { cache: "no-store" });
      const data = await res.json();
      const raw: Market[] = data.markets ?? [];

      // Only shuffle on first load — reuse cached order when returning to feed
      let feedMarkets: Market[];
      if (cachedMarkets) {
        // Keep existing order, but add any new markets and remove stale ones
        const newIds = new Set(raw.map((m) => m.id));
        const existingIds = new Set(cachedMarkets.map((m) => m.id));
        feedMarkets = cachedMarkets.filter((m) => newIds.has(m.id));
        // Append any truly new markets at the end
        for (const m of raw) {
          if (!existingIds.has(m.id)) feedMarkets.push(m);
        }
      } else {
        // First load — shuffle (Fisher-Yates)
        for (let i = raw.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [raw[i], raw[j]] = [raw[j], raw[i]];
        }
        feedMarkets = raw;
      }

      cachedMarkets = feedMarkets;
      cachedSeasonInfo = data.seasonInfo ?? null;
      cachedActivity = data.recentActivity ?? [];
      setMarkets(feedMarkets);
      setSeasonInfo(cachedSeasonInfo);
      setActivity(cachedActivity);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      cachedIsLoggedIn = !!user;
      cachedUserId = user?.id ?? null;
      setIsLoggedIn(cachedIsLoggedIn);

      if (user && feedMarkets.length > 0) {
        const questionIds = feedMarkets.map((m) => m.id);
        const { data: userForecasts } = await supabase
          .from("forecasts")
          .select("question_id")
          .eq("user_id", user.id)
          .in("question_id", questionIds);

        const newVoted = new Set((userForecasts ?? []).map((f: { question_id: string }) => f.question_id));
        cachedVotedIds = newVoted;
        setVotedIds(newVoted);

        // Fetch streak data (last 60 days of forecast timestamps)
        const { data: streakData } = await supabase
          .from("forecasts")
          .select("submitted_at")
          .eq("user_id", user.id)
          .order("submitted_at", { ascending: false })
          .limit(500);
        if (streakData) {
          const streak = computeStreak(streakData.map((f: { submitted_at: string }) => f.submitted_at));
          cachedStreakBefore = streak.current;
          cachedVotedTodayBefore = streak.votedToday;
          hadVotedTodayRef.current = streak.votedToday;
        }
      } else {
        cachedVotedIds = new Set();
        setVotedIds(new Set());
      }
    } catch (e) {
      console.error("Feed load error:", e);
    }
    // Don't show feed until first image is loaded
    const allMarkets = cachedMarkets ?? [];
    const firstUnvoted = allMarkets.find((m) => !cachedVotedIds.has(m.id));
    if (firstUnvoted?.imageUrl) {
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = firstUnvoted.imageUrl!;
      });
    }
    // Preload next few images in background
    const unvoted = allMarkets.filter((m) => !cachedVotedIds.has(m.id));
    unvoted.slice(1, 4).forEach((m) => {
      if (m.imageUrl) {
        const img = new Image();
        img.src = m.imageUrl;
      }
    });
    setLoading(false);

    // Restore scroll position after render
    if (cachedScrollMarketId) {
      requestAnimationFrame(() => {
        const el = cardRefs.current.get(cachedScrollMarketId!);
        if (el) el.scrollIntoView({ behavior: "instant" as ScrollBehavior });
      });
    }
  }, []);

  useEffect(() => {
    loadFeed();
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        setIsLoggedIn(!!session?.user);
        loadFeed();
      }
    });
    return () => subscription.unsubscribe();
  }, [loadFeed]);

  const handleVote = async (marketId: string, vote: boolean) => {
    if (!isLoggedIn) {
      router.push("/signin?next=/");
      return;
    }
    if (submittingId) return;

    setSubmittingId(marketId);
    setConfirmedVote({ marketId, vote });

    const currentFeedIdx = feed.findIndex((m) => m.id === marketId);
    const nextCard = feed[currentFeedIdx + 1];
    const market = feed[currentFeedIdx];

    // Fire API in background
    submitForecast(marketId, vote).catch(() => {});

    // Compute consensus including this vote
    const newTotal = market.voteCount + 1;
    const newYes = market.yesCount + (vote ? 1 : 0);
    const yesPct = Math.round((newYes / newTotal) * 100);

    // Show streak toast on first vote of the day
    const isFirstVoteToday = !hadVotedTodayRef.current;
    if (isFirstVoteToday) {
      hadVotedTodayRef.current = true;
      const newStreak = cachedStreakBefore + 1;
      cachedStreakBefore = newStreak;
      setStreakToast(newStreak);
    }

    // Phase 1 (0-500ms): show checkmark
    // Phase 2 (500-2300ms): show consensus bar + streak
    // Phase 3 (2300ms): remove card + scroll
    setTimeout(() => {
      setConfirmedVote(null);
      setConsensus({ marketId, yesPct, vote });
    }, 500);

    setTimeout(() => {
      setConsensus(null);
      setStreakToast(null);
      setVotedIds((prev) => {
        const next = new Set(prev).add(marketId);
        cachedVotedIds = next;
        return next;
      });
      setSubmittingId(null);

      if (nextCard) {
        setTimeout(() => {
          cardRefs.current.get(nextCard.id)?.scrollIntoView({ behavior: "smooth" });
        }, 50);
        const nextNextCard = feed[currentFeedIdx + 2];
        if (nextNextCard?.imageUrl) {
          const img = new Image();
          img.src = nextNextCard.imageUrl;
        }
      }
    }, 2300);
  };

  // Hide feed when not on homepage
  if (pathname !== "/") return null;

  if (loading) {
    return <div id="swipe-feed" ref={feedRootRef} className="fixed inset-0 z-0 bg-black" />;
  }

  if (feed.length === 0) {
    return (
      <div id="swipe-feed" ref={feedRootRef} className="fixed inset-0 z-0 flex items-center justify-center bg-black">
        <div className="text-center space-y-4 px-6">
          <p className="text-4xl">🎉</p>
          <h2 className="text-xl font-bold text-white">All caught up!</h2>
          <p className="text-white/50">No open markets right now.</p>
          <Link href="/leaderboard" className="text-blue-400 underline text-sm">
            Check the leaderboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div id="swipe-feed" ref={feedRootRef} className="fixed inset-0 z-0 bg-black">
      <SwipePeek label={peekLabel} />

      {/* Prize banner — above swipe layer */}
      {seasonInfo && seasonInfo.totalPrizeCents > 0 && (
        <div className="fixed top-0 left-0 right-0 z-[5] flex justify-center pt-[env(safe-area-inset-top,12px)]" style={swipeStyle}>
          <Link
            href="/leaderboard"
            className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-4 py-2 mt-2 active:scale-[0.93] transition-all duration-150"
          >
            <Trophy className="h-4 w-4 text-amber-300" weight="fill" />
            <span className="text-white font-bold text-sm font-mono">
              {formatDollars(seasonInfo.totalPrizeCents)}
            </span>
          </Link>
        </div>
      )}

      {/* Category filter chips — above swipe layer */}
      {availableCategories.size > 1 && (
        <div
          className="fixed z-[6] left-0 right-0 flex gap-2 px-4 overflow-x-auto no-scrollbar"
          style={{
            ...swipeStyle,
            top: seasonInfo?.totalPrizeCents ? "calc(env(safe-area-inset-top, 12px) + 48px)" : "calc(env(safe-area-inset-top, 12px) + 12px)",
          }}
        >
          <button
            onClick={() => handleCategoryChange(null)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200 active:scale-[0.9] ${
              !categoryFilter
                ? "bg-white text-black"
                : "bg-white/10 text-white/50"
            }`}
          >
            All
          </button>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
            const count = availableCategories.get(key);
            if (!count) return null;
            return (
              <button
                key={key}
                onClick={() => handleCategoryChange(categoryFilter === key ? null : key)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200 active:scale-[0.9] ${
                  categoryFilter === key
                    ? "bg-white text-black"
                    : "bg-white/10 text-white/50"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      <ActivityTicker items={activity} paused={!!submittingId} />

      <div style={swipeStyle} className="relative z-[1] h-full">

      <div ref={scrollContainerRef} className="h-full overflow-y-auto snap-y snap-mandatory">
        {feed.map((market) => {
          const gradient = CATEGORY_GRADIENTS[market.category] || CATEGORY_GRADIENTS.OTHER;

          return (
            <div
              key={market.id}
              ref={(el) => { if (el) cardRefs.current.set(market.id, el); }}
              className="h-[100dvh] w-full snap-start snap-always relative select-none"
            >
              {market.imageUrl ? (
                <img
                  src={market.imageUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  draggable={false}
                />
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-b ${gradient}`} />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/70" />

              <div className="relative z-10 h-full flex flex-col justify-end px-5 pb-24">
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-base">{getQuestionEmoji(market.title, market.category)}</span>
                    <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
                      {CATEGORY_LABELS[market.category] || market.category}
                    </span>
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-4">
                  {market.title}
                </h1>

                {consensus?.marketId === market.id ? (
                  /* ── Consensus reveal ── */
                  <div className="space-y-3 animate-[fade-up_400ms_ease-out]">
                    <div className="relative h-14 rounded-2xl overflow-hidden backdrop-blur-sm bg-white/5">
                      {/* YES bar */}
                      <div
                        className="absolute inset-y-0 left-0 rounded-2xl transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                        style={{
                          width: `${consensus.yesPct}%`,
                          background: consensus.vote
                            ? "linear-gradient(90deg, rgba(74, 222, 128, 0.5), rgba(74, 222, 128, 0.25))"
                            : "rgba(74, 222, 128, 0.2)",
                        }}
                      />
                      {/* Labels */}
                      <div className="relative h-full flex items-center justify-between px-4">
                        <div className="flex items-center gap-2">
                          {consensus.vote && <CheckCircle className="h-5 w-5 text-green-400" weight="fill" />}
                          <span className={`font-bold text-lg ${consensus.vote ? "text-green-400" : "text-white/60"}`}>
                            YES {consensus.yesPct}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-lg ${!consensus.vote ? "text-red-400" : "text-white/60"}`}>
                            {100 - consensus.yesPct}% NO
                          </span>
                          {!consensus.vote && <CheckCircle className="h-5 w-5 text-red-400" weight="fill" />}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <p className="text-xs text-white/40">
                        {market.voteCount + 1} vote{market.voteCount !== 0 ? "s" : ""}
                      </p>
                      {streakToast && consensus?.marketId === market.id && (
                        <div className="flex items-center gap-1 bg-orange-500/20 rounded-full px-2.5 py-0.5 animate-[scale-in_300ms_ease-out]">
                          <Fire className="h-3.5 w-3.5 text-orange-400" weight="fill" />
                          <span className="text-xs font-bold text-orange-300">{streakToast}-day streak</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* ── Vote buttons ── */
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleVote(market.id, true)}
                      disabled={!!submittingId}
                      className={`h-[72px] rounded-2xl font-bold text-2xl transition-all duration-200 backdrop-blur-sm flex items-center justify-center gap-2 ${
                        confirmedVote?.marketId === market.id && confirmedVote.vote === true
                          ? "scale-105"
                          : "active:scale-[0.92]"
                      }`}
                      style={
                        confirmedVote?.marketId === market.id && confirmedVote.vote === true
                          ? { backgroundColor: "rgba(74, 222, 128, 0.6)", color: "#fff", borderWidth: 1, borderColor: "rgba(74, 222, 128, 0.6)" }
                          : { backgroundColor: "rgba(74, 222, 128, 0.35)", color: "#bbf7d0", borderWidth: 1, borderColor: "rgba(74, 222, 128, 0.35)" }
                      }
                    >
                      {confirmedVote?.marketId === market.id && confirmedVote.vote === true ? (
                        <CheckCircle className="h-7 w-7 animate-scale-in" weight="fill" />
                      ) : (
                        "YES"
                      )}
                    </button>
                    <button
                      onClick={() => handleVote(market.id, false)}
                      disabled={!!submittingId}
                      className={`h-[72px] rounded-2xl font-bold text-2xl transition-all duration-200 backdrop-blur-sm flex items-center justify-center gap-2 ${
                        confirmedVote?.marketId === market.id && confirmedVote.vote === false
                          ? "scale-105"
                          : "active:scale-[0.92]"
                      }`}
                      style={
                        confirmedVote?.marketId === market.id && confirmedVote.vote === false
                          ? { backgroundColor: "rgba(248, 113, 113, 0.6)", color: "#fff", borderWidth: 1, borderColor: "rgba(248, 113, 113, 0.6)" }
                          : { backgroundColor: "rgba(248, 113, 113, 0.35)", color: "#fecaca", borderWidth: 1, borderColor: "rgba(248, 113, 113, 0.35)" }
                      }
                    >
                      {confirmedVote?.marketId === market.id && confirmedVote.vote === false ? (
                        <CheckCircle className="h-7 w-7 animate-scale-in" weight="fill" />
                      ) : (
                        "NO"
                      )}
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-white/50">
                    {market.voteCount} vote{market.voteCount !== 1 ? "s" : ""}
                  </span>
                  {market.description && (
                    <button
                      onClick={() => setShowResolution(market.id)}
                      className="flex items-center gap-1 text-xs text-white/40 active:scale-[0.93] transition-all duration-150"
                    >
                      <Info className="h-3.5 w-3.5" />
                      Resolution
                    </button>
                  )}
                </div>
              </div>

              {showResolution === market.id && market.description && (
                <div
                  className="absolute inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-center px-6"
                  onClick={() => setShowResolution(null)}
                >
                  <div
                    className="bg-zinc-900 rounded-2xl p-6 max-w-sm w-full space-y-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white text-lg">Resolution Criteria</h3>
                      <button
                        onClick={() => setShowResolution(null)}
                        className="text-white/40 hover:text-white/70 active:scale-[0.85] transition-all duration-150"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed">
                      {market.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
