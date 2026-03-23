"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { submitForecast } from "@/actions/forecasts";
import { CATEGORY_LABELS, getQuestionEmoji } from "@/lib/constants";
import { Trophy, Info, X } from "@phosphor-icons/react";
import { toast } from "sonner";
import Link from "next/link";
import { formatDollars } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface Market {
  id: string;
  title: string;
  category: string;
  description: string | null;
  imageUrl: string | null;
  voteCount: number;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  SPORTS: "from-blue-900/90 to-blue-600/40",
  CAMPUS: "from-purple-900/90 to-purple-600/40",
  ACADEMICS: "from-amber-900/90 to-amber-600/40",
  GREEK: "from-emerald-900/90 to-emerald-600/40",
  LAW_SCHOOL: "from-red-900/90 to-red-600/40",
  OTHER: "from-zinc-900/90 to-zinc-600/40",
};

// In-memory cache
let cachedMarkets: Market[] | null = null;
let cachedSeasonInfo: { name: string; totalPrizeCents: number } | null = null;
let cachedVotedIds: Set<string> = new Set();
let cachedIsLoggedIn = false;

export function SwipeFeed() {
  const [markets, setMarkets] = useState<Market[]>(cachedMarkets ?? []);
  const [loading, setLoading] = useState(cachedMarkets === null);
  const [seasonInfo, setSeasonInfo] = useState(cachedSeasonInfo);
  const [isLoggedIn, setIsLoggedIn] = useState(cachedIsLoggedIn);
  const [submitting, setSubmitting] = useState(false);
  const [votedIds, setVotedIds] = useState<Set<string>>(cachedVotedIds);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResolution, setShowResolution] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [animating, setAnimating] = useState<"up" | "down" | null>(null);
  const router = useRouter();

  // Filter to only unvoted markets
  const feed = useMemo(
    () => markets.filter((m) => !votedIds.has(m.id)),
    [markets, votedIds]
  );

  const market = feed[currentIndex] ?? null;

  const loadFeed = useCallback(async () => {
    try {
      const res = await fetch("/api/feed", { cache: "no-store" });
      const data = await res.json();
      const feedMarkets: Market[] = data.markets ?? [];

      cachedMarkets = feedMarkets;
      cachedSeasonInfo = data.seasonInfo ?? null;
      setMarkets(feedMarkets);
      setSeasonInfo(cachedSeasonInfo);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      cachedIsLoggedIn = !!user;
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
      } else {
        cachedVotedIds = new Set();
        setVotedIds(new Set());
      }
    } catch (e) {
      console.error("Feed load error:", e);
    }
    setLoading(false);
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

  const goNext = useCallback(() => {
    if (currentIndex < feed.length - 1 && !animating) {
      setAnimating("up");
      setTimeout(() => {
        setCurrentIndex((i) => i + 1);
        setAnimating(null);
      }, 250);
    }
  }, [currentIndex, feed.length, animating]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0 && !animating) {
      setAnimating("down");
      setTimeout(() => {
        setCurrentIndex((i) => i - 1);
        setAnimating(null);
      }, 250);
    }
  }, [currentIndex, animating]);

  const handleVote = async (vote: boolean) => {
    if (!market) return;
    if (!isLoggedIn) {
      router.push("/signin?next=/");
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    try {
      await submitForecast(market.id, vote);
      // Slide up then swap card
      setAnimating("up");
      setTimeout(() => {
        setVotedIds((prev) => {
          const next = new Set(prev).add(market.id);
          cachedVotedIds = next;
          return next;
        });
        setAnimating(null);
        setSubmitting(false);
      }, 250);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to vote");
      setSubmitting(false);
    }
  };

  // Touch handling for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(deltaY) > 60) {
      if (deltaY > 0) goNext();
      else goPrev();
    }
  };

  if (loading) {
    return <div className="fixed inset-0 bg-black" />;
  }

  if (!market) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
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

  const gradient = CATEGORY_GRADIENTS[market.category] || CATEGORY_GRADIENTS.OTHER;

  return (
    <div
      className="fixed inset-0 bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: "none" }}
    >
      {/* Prize pool */}
      {seasonInfo && seasonInfo.totalPrizeCents > 0 && (
        <div className="fixed top-0 left-0 right-0 z-20 flex justify-center pt-[env(safe-area-inset-top,12px)]">
          <Link
            href="/leaderboard"
            className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-4 py-2 mt-2 active:scale-[0.93] active:bg-black/60 transition-all duration-150"
          >
            <Trophy className="h-4 w-4 text-amber-300" weight="fill" />
            <span className="text-white font-bold text-sm font-mono">
              {formatDollars(seasonInfo.totalPrizeCents)}
            </span>
          </Link>
        </div>
      )}

      {/* Single card with slide animation */}
      <div
        key={market.id}
        className={`absolute inset-0 transition-all duration-250 ease-out ${
          animating === "up" ? "-translate-y-full opacity-0" :
          animating === "down" ? "translate-y-full opacity-0" :
          "translate-y-0 opacity-100"
        }`}
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
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end px-5 pb-24">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1">
            <span className="text-base">{getQuestionEmoji(market.title, market.category)}</span>
            <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
              {CATEGORY_LABELS[market.category] || market.category}
            </span>
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-2">
          {market.title}
        </h1>

        <div className="flex items-center gap-3 mb-5">
          <span className="text-sm text-white/50">
            {market.voteCount} vote{market.voteCount !== 1 ? "s" : ""}
          </span>
          {market.description && (
            <button
              onClick={() => setShowResolution(true)}
              className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 active:scale-[0.93] transition-all duration-150"
            >
              <Info className="h-3.5 w-3.5" />
              Resolution
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleVote(true)}
            disabled={submitting}
            className="h-[72px] rounded-2xl font-bold text-2xl transition-all duration-150 active:scale-[0.92] bg-green-500/25 text-green-300 backdrop-blur-sm border border-green-400/25 hover:bg-green-500/35"
          >
            YES
          </button>
          <button
            onClick={() => handleVote(false)}
            disabled={submitting}
            className="h-[72px] rounded-2xl font-bold text-2xl transition-all duration-150 active:scale-[0.92] bg-red-500/25 text-red-300 backdrop-blur-sm border border-red-400/25 hover:bg-red-500/35"
          >
            NO
          </button>
        </div>
      </div>

      {/* Resolution modal */}
      {showResolution && market.description && (
        <div
          className="absolute inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-center px-6"
          onClick={() => setShowResolution(false)}
        >
          <div
            className="bg-zinc-900 rounded-2xl p-6 max-w-sm w-full space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-lg">Resolution Criteria</h3>
              <button
                onClick={() => setShowResolution(false)}
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
}
