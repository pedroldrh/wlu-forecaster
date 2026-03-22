"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { submitForecast } from "@/actions/forecasts";
import { CATEGORY_LABELS, getQuestionEmoji } from "@/lib/constants";
import { Check, ChatCircle, CaretDown, Trophy } from "@phosphor-icons/react";
import { CountdownTimer } from "@/components/countdown-timer";
import { toast } from "sonner";
import Link from "next/link";
import { formatDollars } from "@/lib/utils";

interface Market {
  id: string;
  title: string;
  category: string;
  imageUrl: string | null;
  closeTime: string;
  voteCount: number;
  userVote: boolean | null;
  comments: { content: string; display_name: string }[];
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
  markets: Market[];
  isLoggedIn: boolean;
  seasonInfo?: { name: string; totalPrizeCents: number } | null;
}

export function SwipeFeed({ markets, isLoggedIn, seasonInfo }: SwipeFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [votes, setVotes] = useState<Map<string, boolean>>(() => {
    const map = new Map();
    markets.forEach((m) => {
      if (m.userVote !== null) map.set(m.id, m.userVote);
    });
    return map;
  });
  const [submitting, setSubmitting] = useState<boolean | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"up" | "down" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchStartX = useRef<number>(0);
  const router = useRouter();

  const market = markets[currentIndex];
  const userVote = votes.get(market?.id) ?? null;
  const gradient = CATEGORY_GRADIENTS[market?.category] || CATEGORY_GRADIENTS.OTHER;

  const goNext = useCallback(() => {
    if (currentIndex < markets.length - 1) {
      setSlideDirection("up");
      setTimeout(() => {
        setCurrentIndex((i) => i + 1);
        setShowComments(false);
        setSlideDirection(null);
      }, 200);
    }
  }, [currentIndex, markets.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setSlideDirection("down");
      setTimeout(() => {
        setCurrentIndex((i) => i - 1);
        setShowComments(false);
        setSlideDirection(null);
      }, 200);
    }
  }, [currentIndex]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const deltaY = touchStartY.current - e.changedTouches[0].clientY;
      const deltaX = Math.abs(touchStartX.current - e.changedTouches[0].clientX);

      if (Math.abs(deltaY) > 60 && Math.abs(deltaY) > deltaX) {
        if (deltaY > 0) goNext();
        else goPrev();
      }
    },
    [goNext, goPrev]
  );

  const handleVote = async (vote: boolean) => {
    if (!isLoggedIn) {
      router.push("/signin?next=/");
      return;
    }
    if (submitting !== null) return;
    setSubmitting(vote);
    try {
      await submitForecast(market.id, vote);
      setVotes((prev) => new Map(prev).set(market.id, vote));
      toast.success(vote ? "Voted YES!" : "Voted NO!", { duration: 1000 });
      if (userVote === null) {
        setTimeout(goNext, 800);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to vote");
    }
    setSubmitting(null);
  };

  if (!market) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center space-y-4 px-6">
          <p className="text-4xl">🎉</p>
          <h2 className="text-xl font-bold">All caught up!</h2>
          <p className="text-muted-foreground">No open markets right now.</p>
          <Link href="/leaderboard" className="text-primary underline text-sm">
            Check the leaderboard
          </Link>
        </div>
      </div>
    );
  }

  const slideClass = slideDirection === "up"
    ? "animate-slide-out-up"
    : slideDirection === "down"
      ? "animate-slide-out-down"
      : "animate-slide-in";

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black select-none overflow-hidden"
      style={{ touchAction: "none" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Card container with animation */}
      <div key={market.id} className={`absolute inset-0 ${slideClass}`}>
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
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80" />
      </div>

      {/* Content — vertically centered */}
      <div className="relative z-10 flex flex-col h-full justify-center px-5">
        {/* Prize pool — centered at top area */}
        {seasonInfo && seasonInfo.totalPrizeCents > 0 && (
          <div className="absolute top-0 left-0 right-0 flex justify-center pt-[env(safe-area-inset-top,12px)]">
            <Link
              href="/leaderboard"
              className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mt-2"
            >
              <Trophy className="h-4 w-4 text-amber-300" weight="fill" />
              <span className="text-white font-bold text-sm font-mono">
                {formatDollars(seasonInfo.totalPrizeCents)}
              </span>
            </Link>
          </div>
        )}

        {/* Market content — centered */}
        <div className="space-y-4">
          {/* Category + emoji */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getQuestionEmoji(market.title, market.category)}</span>
            <span className="text-xs font-bold text-white/70 uppercase tracking-wider">
              {CATEGORY_LABELS[market.category] || market.category}
            </span>
          </div>

          {/* Title */}
          <Link href={`/questions/${market.id}`}>
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              {market.title}
            </h1>
          </Link>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-sm text-white/60">
            <span>{market.voteCount} vote{market.voteCount !== 1 ? "s" : ""}</span>
            <CountdownTimer targetDate={market.closeTime} className="text-white/60" />
          </div>

          {/* Comments */}
          {market.comments.length > 0 && (
            <div>
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-1.5 text-white/50 text-xs mb-2"
              >
                <ChatCircle className="h-3.5 w-3.5" />
                {market.comments.length} comment{market.comments.length !== 1 ? "s" : ""}
                <CaretDown className={`h-3 w-3 transition-transform ${showComments ? "rotate-180" : ""}`} />
              </button>
              {showComments && (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {market.comments.map((c, i) => (
                    <div key={i} className="text-sm">
                      <span className="font-semibold text-white/80">{c.display_name}</span>
                      <span className="text-white/60 ml-1.5">{c.content}</span>
                    </div>
                  ))}
                  <Link
                    href={`/questions/${market.id}`}
                    className="text-xs text-white/40 hover:text-white/60"
                  >
                    View all comments
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Vote buttons */}
          <div className="pt-2">
            {userVote !== null && (
              <p className="text-xs text-center text-white/50 mb-2">
                You voted {userVote ? "YES" : "NO"} · tap to change
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleVote(true)}
                disabled={submitting !== null}
                className={`relative h-16 rounded-2xl font-bold text-xl transition-all active:scale-[0.96] ${
                  userVote === true
                    ? "bg-green-400 text-white shadow-lg shadow-green-400/30"
                    : "bg-green-500/20 text-green-300 hover:bg-green-500/30 backdrop-blur-sm border border-green-400/30"
                } ${submitting === true ? "animate-pulse" : ""}`}
              >
                {userVote === true && (
                  <Check className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" weight="bold" />
                )}
                YES
              </button>
              <button
                onClick={() => handleVote(false)}
                disabled={submitting !== null}
                className={`relative h-16 rounded-2xl font-bold text-xl transition-all active:scale-[0.96] ${
                  userVote === false
                    ? "bg-red-400 text-white shadow-lg shadow-red-400/30"
                    : "bg-red-500/20 text-red-300 hover:bg-red-500/30 backdrop-blur-sm border border-red-400/30"
                } ${submitting === false ? "animate-pulse" : ""}`}
              >
                {userVote === false && (
                  <Check className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" weight="bold" />
                )}
                NO
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
