"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitForecast } from "@/actions/forecasts";
import { CATEGORY_LABELS, getQuestionEmoji } from "@/lib/constants";
import { Check, Trophy, Info, X } from "@phosphor-icons/react";
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

interface SwipeFeedProps {
  initialMarkets?: Market[];
  initialSeasonInfo?: { name: string; totalPrizeCents: number } | null;
}

export function SwipeFeed({ initialMarkets, initialSeasonInfo }: SwipeFeedProps) {
  const [markets, setMarkets] = useState<Market[]>(initialMarkets ?? []);
  const [loading, setLoading] = useState(!initialMarkets || initialMarkets.length === 0);
  const [seasonInfo, setSeasonInfo] = useState(initialSeasonInfo ?? null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [submittingMap, setSubmittingMap] = useState<Map<string, boolean | null>>(new Map());
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [showResolution, setShowResolution] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function loadUserData(marketList: Market[]) {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);

      if (user && marketList.length > 0) {
        const questionIds = marketList.map((m) => m.id);
        const { data: userForecasts } = await supabase
          .from("forecasts")
          .select("question_id")
          .eq("user_id", user.id)
          .in("question_id", questionIds);

        if (userForecasts && userForecasts.length > 0) {
          setVotedIds(new Set(userForecasts.map((f: { question_id: string }) => f.question_id)));
        }
      }
    }

    async function loadFeed() {
      try {
        const res = await fetch("/api/feed");
        const data = await res.json();
        const feedMarkets = data.markets ?? [];
        setMarkets(feedMarkets);
        setSeasonInfo(data.seasonInfo ?? null);
        await loadUserData(feedMarkets);
      } catch (e) {
        console.error("Feed load error:", e);
      }
      setLoading(false);
    }

    // If we have initial data from SSR, just load user data
    // Otherwise fetch everything from the API
    if (initialMarkets && initialMarkets.length > 0) {
      loadUserData(initialMarkets).then(() => setLoading(false));
    } else {
      // Fallback: fetch from API (in case SSR didn't provide data)
      loadFeed();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
      if (session?.user) {
        loadFeed();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const visibleMarkets = markets.filter((m) => !votedIds.has(m.id));

  const handleVote = async (marketId: string, vote: boolean) => {
    if (!isLoggedIn) {
      router.push("/signin?next=/");
      return;
    }
    if (submittingMap.get(marketId) !== undefined && submittingMap.get(marketId) !== null) return;

    setSubmittingMap((prev) => new Map(prev).set(marketId, vote));
    try {
      await submitForecast(marketId, vote);
      toast.success(vote ? "Voted YES!" : "Voted NO!", { duration: 1000 });
      setTimeout(() => {
        setVotedIds((prev) => new Set(prev).add(marketId));
      }, 600);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to vote");
    }
    setSubmittingMap((prev) => new Map(prev).set(marketId, null));
  };

  if (loading) {
    return <div className="fixed inset-0 bg-black" />;
  }

  if (visibleMarkets.length === 0) {
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
      {seasonInfo && seasonInfo.totalPrizeCents > 0 && (
        <div className="fixed top-0 left-0 right-0 z-20 flex justify-center pt-[env(safe-area-inset-top,12px)]">
          <Link
            href="/leaderboard"
            className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-4 py-2 mt-2"
          >
            <Trophy className="h-4 w-4 text-amber-300" weight="fill" />
            <span className="text-white font-bold text-sm font-mono">
              {formatDollars(seasonInfo.totalPrizeCents)}
            </span>
          </Link>
        </div>
      )}

      <div
        className="h-full overflow-y-auto snap-y snap-mandatory"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {visibleMarkets.map((market) => {
          const gradient = CATEGORY_GRADIENTS[market.category] || CATEGORY_GRADIENTS.OTHER;
          const isSubmitting = submittingMap.get(market.id);

          return (
            <div
              key={market.id}
              className="h-[100dvh] w-full snap-start snap-always relative"
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
                  <span className="text-2xl">{getQuestionEmoji(market.title, market.category)}</span>
                  <span className="text-xs font-bold text-white/70 uppercase tracking-wider">
                    {CATEGORY_LABELS[market.category] || market.category}
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
                      className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors"
                    >
                      <Info className="h-3.5 w-3.5" />
                      Resolution
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleVote(market.id, true)}
                    disabled={isSubmitting !== undefined && isSubmitting !== null}
                    className={`relative h-[72px] rounded-2xl font-bold text-2xl transition-all active:scale-[0.96] bg-green-500/25 text-green-300 backdrop-blur-sm border border-green-400/25 ${
                      isSubmitting === true ? "!bg-green-400 !text-white shadow-lg shadow-green-400/30" : ""
                    }`}
                  >
                    {isSubmitting === true && (
                      <Check className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6" weight="bold" />
                    )}
                    YES
                  </button>
                  <button
                    onClick={() => handleVote(market.id, false)}
                    disabled={isSubmitting !== undefined && isSubmitting !== null}
                    className={`relative h-[72px] rounded-2xl font-bold text-2xl transition-all active:scale-[0.96] bg-red-500/25 text-red-300 backdrop-blur-sm border border-red-400/25 ${
                      isSubmitting === false ? "!bg-red-400 !text-white shadow-lg shadow-red-400/30" : ""
                    }`}
                  >
                    {isSubmitting === false && (
                      <Check className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6" weight="bold" />
                    )}
                    NO
                  </button>
                </div>
              </div>

              {showResolution === market.id && (
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
                        className="text-white/40 hover:text-white/70 transition-colors"
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
