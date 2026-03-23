"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [votedIds, setVotedIds] = useState<Set<string>>(cachedVotedIds);
  const [showResolution, setShowResolution] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const router = useRouter();

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

        // Auto-scroll to first unvoted card
        const firstUnvoted = feedMarkets.find((m) => !newVoted.has(m.id));
        if (firstUnvoted) {
          setTimeout(() => {
            cardRefs.current.get(firstUnvoted.id)?.scrollIntoView({ behavior: "instant" });
          }, 50);
        }
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

  const handleVote = async (marketId: string, vote: boolean) => {
    if (!isLoggedIn) {
      router.push("/signin?next=/");
      return;
    }
    if (submittingId) return;

    setSubmittingId(marketId);
    try {
      await submitForecast(marketId, vote);
      setVotedIds((prev) => {
        const next = new Set(prev).add(marketId);
        cachedVotedIds = next;
        return next;
      });

      // Auto-scroll to next unvoted card
      const currentIdx = markets.findIndex((m) => m.id === marketId);
      for (let i = currentIdx + 1; i < markets.length; i++) {
        if (!votedIds.has(markets[i].id) && markets[i].id !== marketId) {
          setTimeout(() => {
            cardRefs.current.get(markets[i].id)?.scrollIntoView({ behavior: "smooth" });
          }, 100);
          break;
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to vote");
    }
    setSubmittingId(null);
  };

  if (loading) {
    return <div className="fixed inset-0 bg-black" />;
  }

  if (markets.length === 0) {
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

  return (
    <div className="fixed inset-0 bg-black">
      {/* Prize pool */}
      {seasonInfo && seasonInfo.totalPrizeCents > 0 && (
        <div className="fixed top-0 left-0 right-0 z-20 flex justify-center pt-[env(safe-area-inset-top,12px)]">
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

      {/* IG Reels-style scroll container */}
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto snap-y snap-mandatory"
      >
        {markets.map((market) => {
          const gradient = CATEGORY_GRADIENTS[market.category] || CATEGORY_GRADIENTS.OTHER;
          const isVoted = votedIds.has(market.id);
          const isThisSubmitting = submittingId === market.id;

          return (
            <div
              key={market.id}
              ref={(el) => { if (el) cardRefs.current.set(market.id, el); }}
              className="h-[100dvh] w-full snap-start snap-always relative select-none"
            >
              {/* Background */}
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
                      onClick={() => setShowResolution(market.id)}
                      className="flex items-center gap-1 text-xs text-white/40 active:scale-[0.93] transition-all duration-150"
                    >
                      <Info className="h-3.5 w-3.5" />
                      Resolution
                    </button>
                  )}
                </div>

                {/* Vote buttons */}
                {isVoted ? (
                  <div className="h-[72px] rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-white/40 font-semibold">Voted</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleVote(market.id, true)}
                      disabled={!!submittingId}
                      className="h-[72px] rounded-2xl font-bold text-2xl transition-all duration-150 active:scale-[0.92] bg-green-500/25 text-green-300 backdrop-blur-sm border border-green-400/25"
                    >
                      YES
                    </button>
                    <button
                      onClick={() => handleVote(market.id, false)}
                      disabled={!!submittingId}
                      className="h-[72px] rounded-2xl font-bold text-2xl transition-all duration-150 active:scale-[0.92] bg-red-500/25 text-red-300 backdrop-blur-sm border border-red-400/25"
                    >
                      NO
                    </button>
                  </div>
                )}
              </div>

              {/* Resolution modal */}
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
  );
}
