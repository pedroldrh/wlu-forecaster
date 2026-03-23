"use client";

import { useState, useEffect } from "react";
import { X, Fire, Trophy, ChartLineUp, Clock, Target, ShareNetwork, Check } from "@phosphor-icons/react";
import { CATEGORY_LABELS } from "@/lib/constants";

interface RecapData {
  displayName: string;
  seasonName: string;
  totalForecasts: number;
  totalMarkets: number;
  resolvedCount: number;
  participants: number;
  wins: number;
  losses: number;
  winRate: number;
  bestCategory: { name: string; wins: number; total: number } | null;
  correctCalls: { title: string; category: string }[];
  wrongCalls: { title: string; category: string }[];
  peakHour: number;
  streak: { current: number; longest: number; votedToday: boolean };
  questionsPlayed: number;
}

function formatHour(h: number): string {
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

export function SeasonRecapButton({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full rounded-xl bg-gradient-to-r from-violet-600/20 via-fuchsia-600/20 to-amber-600/20 border border-white/10 px-4 py-3.5 active:scale-[0.97] transition-all"
      >
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
          <ChartLineUp className="h-5 w-5 text-white" weight="bold" />
        </div>
        <div className="text-left">
          <p className="text-sm font-bold text-white">Season Recap</p>
          <p className="text-xs text-white/40">Your Wrapped-style summary</p>
        </div>
      </button>

      {open && <SeasonRecapModal userId={userId} onClose={() => setOpen(false)} />}
    </>
  );
}

function SeasonRecapModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [data, setData] = useState<RecapData | null>(null);
  const [slide, setSlide] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");

  useEffect(() => {
    fetch(`/api/recap/${userId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then(setData)
      .catch(() => onClose());
  }, [userId, onClose]);

  if (!data) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const slides = buildSlides(data);
  const totalSlides = slides.length;

  const goNext = () => {
    if (slide < totalSlides - 1) {
      setDirection("next");
      setSlide(slide + 1);
    }
  };
  const goPrev = () => {
    if (slide > 0) {
      setDirection("prev");
      setSlide(slide - 1);
    }
  };

  const current = slides[slide];

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-[max(env(safe-area-inset-top,16px),16px)] right-4 z-20 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 active:scale-[0.85] transition-all"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Progress bar */}
      <div className="absolute top-[max(env(safe-area-inset-top,16px),16px)] left-4 right-16 z-20 flex gap-1">
        {slides.map((_, i) => (
          <div key={i} className="flex-1 h-[3px] rounded-full overflow-hidden bg-white/15">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                i < slide ? "w-full bg-white/70" : i === slide ? "w-full bg-white" : "w-0"
              }`}
            />
          </div>
        ))}
      </div>

      {/* Tap zones */}
      <div className="absolute inset-0 z-10 flex">
        <div className="w-1/3 h-full" onClick={goPrev} />
        <div className="w-1/3 h-full" />
        <div className="w-1/3 h-full" onClick={goNext} />
      </div>

      {/* Slide content */}
      <div
        key={slide}
        className={`relative z-0 h-full flex flex-col items-center justify-center px-8 animate-[${
          direction === "next" ? "fade-up" : "fade-up"
        }_400ms_ease-out]`}
        style={{ background: current.bg }}
      >
        {current.content}
      </div>

      {/* Bottom: slide counter + share on last slide */}
      <div className="absolute bottom-[max(env(safe-area-inset-bottom,24px),24px)] left-0 right-0 z-20 flex justify-center">
        {slide === totalSlides - 1 ? (
          <ShareRecapButton data={data} />
        ) : (
          <p className="text-xs text-white/30">Tap to continue</p>
        )}
      </div>
    </div>
  );
}

function ShareRecapButton({ data }: { data: RecapData }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const text = `My ${data.seasonName} Recap: ${data.wins}W-${data.losses}L (${data.winRate}% win rate) from ${data.totalForecasts} predictions. Play on Forecaster!`;
    const url = "https://wluforcaster.com";

    if (navigator.share) {
      try { await navigator.share({ title: "Forecaster Recap", text, url }); return; } catch {}
    }
    try { await navigator.clipboard.writeText(`${text}\n${url}`); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-black active:scale-[0.93] transition-all z-30"
    >
      {copied ? (
        <><Check className="h-4 w-4" weight="bold" />Copied!</>
      ) : (
        <><ShareNetwork className="h-4 w-4" weight="bold" />Share Recap</>
      )}
    </button>
  );
}

interface Slide {
  bg: string;
  content: React.ReactNode;
}

function buildSlides(data: RecapData): Slide[] {
  const slides: Slide[] = [];

  // Slide 1: Intro
  slides.push({
    bg: "linear-gradient(145deg, #1a0533 0%, #0a0a0a 60%)",
    content: (
      <div className="text-center space-y-6 max-w-xs">
        <p className="text-sm font-bold text-violet-400 uppercase tracking-widest">Your Season Recap</p>
        <h1 className="text-4xl font-black text-white leading-tight">{data.seasonName}</h1>
        <p className="text-white/40 text-sm">
          {data.participants} forecasters competed across {data.totalMarkets} markets
        </p>
        <div className="pt-4">
          <p className="text-lg text-white/60">{data.displayName}</p>
        </div>
      </div>
    ),
  });

  // Slide 2: Total predictions
  slides.push({
    bg: "linear-gradient(145deg, #0c2d1b 0%, #0a0a0a 60%)",
    content: (
      <div className="text-center space-y-4 max-w-xs">
        <p className="text-sm font-bold text-emerald-400 uppercase tracking-widest">You showed up</p>
        <p className="text-8xl font-black text-white leading-none">{data.totalForecasts}</p>
        <p className="text-xl text-white/60">predictions made</p>
        <p className="text-sm text-white/30">
          on {data.questionsPlayed} resolved market{data.questionsPlayed !== 1 ? "s" : ""}
        </p>
      </div>
    ),
  });

  // Slide 3: Record
  if (data.questionsPlayed > 0) {
    slides.push({
      bg: "linear-gradient(145deg, #1a1a00 0%, #0a0a0a 60%)",
      content: (
        <div className="text-center space-y-6 max-w-xs">
          <p className="text-sm font-bold text-amber-400 uppercase tracking-widest">Your Record</p>
          <div className="flex items-baseline justify-center gap-3">
            <span className="text-7xl font-black text-green-400 font-mono">{data.wins}</span>
            <span className="text-4xl font-bold text-white/20">-</span>
            <span className="text-7xl font-black text-red-400 font-mono">{data.losses}</span>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-white">{data.winRate}%</p>
            <p className="text-sm text-white/40">win rate</p>
          </div>
        </div>
      ),
    });
  }

  // Slide 4: Best calls
  if (data.correctCalls.length > 0) {
    slides.push({
      bg: "linear-gradient(145deg, #002b1a 0%, #0a0a0a 60%)",
      content: (
        <div className="space-y-5 max-w-sm w-full">
          <div className="text-center">
            <p className="text-sm font-bold text-green-400 uppercase tracking-widest mb-1">Nailed it</p>
            <p className="text-white/40 text-xs">Your correct calls</p>
          </div>
          <div className="space-y-2.5">
            {data.correctCalls.map((c, i) => (
              <div key={i} className="bg-green-500/10 border border-green-500/15 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                  <Check className="h-4 w-4 text-green-400" weight="bold" />
                </div>
                <p className="text-sm text-white font-medium leading-snug truncate">{c.title}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    });
  }

  // Slide 5: Best category
  if (data.bestCategory) {
    const catLabel = CATEGORY_LABELS[data.bestCategory.name] || data.bestCategory.name;
    const catRate = Math.round((data.bestCategory.wins / data.bestCategory.total) * 100);
    slides.push({
      bg: "linear-gradient(145deg, #1a0a2e 0%, #0a0a0a 60%)",
      content: (
        <div className="text-center space-y-5 max-w-xs">
          <p className="text-sm font-bold text-fuchsia-400 uppercase tracking-widest">Your best category</p>
          <div className="space-y-2">
            <p className="text-5xl font-black text-white">{catLabel}</p>
            <p className="text-lg text-white/50">
              {data.bestCategory.wins}/{data.bestCategory.total} correct · {catRate}%
            </p>
          </div>
          <Target className="h-12 w-12 text-fuchsia-400/50 mx-auto" weight="duotone" />
        </div>
      ),
    });
  }

  // Slide 6: Peak hour
  slides.push({
    bg: "linear-gradient(145deg, #0a1628 0%, #0a0a0a 60%)",
    content: (
      <div className="text-center space-y-5 max-w-xs">
        <p className="text-sm font-bold text-sky-400 uppercase tracking-widest">Peak voting hour</p>
        <p className="text-7xl font-black text-white">{formatHour(data.peakHour)}</p>
        <Clock className="h-10 w-10 text-sky-400/50 mx-auto" weight="duotone" />
        <p className="text-sm text-white/30">
          When you make your best decisions (apparently)
        </p>
      </div>
    ),
  });

  // Slide 7: Streak
  if (data.streak.longest > 0) {
    slides.push({
      bg: "linear-gradient(145deg, #2d1500 0%, #0a0a0a 60%)",
      content: (
        <div className="text-center space-y-5 max-w-xs">
          <p className="text-sm font-bold text-orange-400 uppercase tracking-widest">Longest streak</p>
          <div className="flex items-center justify-center gap-3">
            <Fire className="h-14 w-14 text-orange-400" weight="fill" />
            <span className="text-8xl font-black text-white">{data.streak.longest}</span>
          </div>
          <p className="text-lg text-white/50">
            day{data.streak.longest !== 1 ? "s" : ""} in a row
          </p>
          {data.streak.current > 0 && (
            <p className="text-sm text-orange-400/60">
              Currently on a {data.streak.current}-day streak
            </p>
          )}
        </div>
      ),
    });
  }

  // Slide 8: Final — the summary card
  slides.push({
    bg: "linear-gradient(145deg, #1a0533 0%, #0c2d1b 50%, #0a0a0a 100%)",
    content: (
      <div className="text-center space-y-6 max-w-xs">
        <Trophy className="h-16 w-16 text-amber-400 mx-auto" weight="fill" />
        <h2 className="text-3xl font-black text-white">{data.displayName}</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-2xl font-black text-green-400 font-mono">{data.wins}</p>
            <p className="text-xs text-white/40">Wins</p>
          </div>
          <div>
            <p className="text-2xl font-black text-red-400 font-mono">{data.losses}</p>
            <p className="text-xs text-white/40">Losses</p>
          </div>
          <div>
            <p className="text-2xl font-black text-white font-mono">{data.winRate}%</p>
            <p className="text-xs text-white/40">Win Rate</p>
          </div>
        </div>
        <div className="pt-2 space-y-1">
          <p className="text-sm text-white/40">{data.seasonName}</p>
          <p className="text-xs text-white/20">wluforcaster.com</p>
        </div>
      </div>
    ),
  });

  return slides;
}
