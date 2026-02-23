"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDollars } from "@/lib/utils";
import { SEASON_STATUS_LABELS } from "@/lib/constants";
import { Calendar, Zap } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";

interface SeasonBannerProps {
  id: string;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
  prize1stCents: number;
  prize2ndCents: number;
  prize3rdCents: number;
  prize4thCents: number;
  prize5thCents: number;
  prizeBonusCents: number;
  status: string;
  participantIds?: string[];
}

const CONFETTI_COLORS = [
  "bg-amber-400",
  "bg-blue-400",
  "bg-emerald-400",
  "bg-rose-400",
  "bg-violet-400",
  "bg-yellow-300",
  "bg-indigo-400",
  "bg-orange-400",
];

function Confetti() {
  const pieces = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * 360;
    const rad = (angle * Math.PI) / 180;
    const distance = 60 + Math.random() * 80;
    const x = Math.cos(rad) * distance;
    const y = -Math.abs(Math.sin(rad) * distance) - 20;
    const rotate = Math.random() * 540 - 180;
    const delay = Math.random() * 0.4;
    const duration = 0.8 + Math.random() * 0.6;
    const size = 4 + Math.random() * 4;
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    const isCircle = i % 3 === 0;

    return (
      <span
        key={i}
        className={`absolute ${color} ${isCircle ? "rounded-full" : "rounded-sm"}`}
        style={{
          width: size,
          height: isCircle ? size : size * 1.5,
          left: "50%",
          top: "50%",
          "--confetti-x": `${x}px`,
          "--confetti-y": `${y}px`,
          "--confetti-rotate": `${rotate}deg`,
          animation: `confetti-spread ${duration}s ease-out ${delay}s both`,
        } as React.CSSProperties}
      />
    );
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {pieces}
    </div>
  );
}

function GoldTrophy({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className}>
      <defs>
        <linearGradient id="trophy-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="40%" stopColor="#FFC107" />
          <stop offset="70%" stopColor="#FFB300" />
          <stop offset="100%" stopColor="#FF8F00" />
        </linearGradient>
        <linearGradient id="trophy-shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF9C4" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Cup body */}
      <path
        d="M18 12h28v6c0 10-6 18-14 22-8-4-14-12-14-22v-6z"
        fill="url(#trophy-gold)"
        stroke="#E6A800"
        strokeWidth="1"
      />
      {/* Shine */}
      <path
        d="M22 14h8v4c0 7-2 12-4 14-2-2-4-7-4-14v-4z"
        fill="url(#trophy-shine)"
      />
      {/* Left handle */}
      <path
        d="M18 16c-6 0-10 4-10 8s4 8 10 8"
        stroke="url(#trophy-gold)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* Right handle */}
      <path
        d="M46 16c6 0 10 4 10 8s-4 8-10 8"
        stroke="url(#trophy-gold)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* Stem */}
      <rect x="29" y="40" width="6" height="8" rx="1" fill="url(#trophy-gold)" />
      {/* Base */}
      <rect x="22" y="48" width="20" height="4" rx="2" fill="url(#trophy-gold)" stroke="#E6A800" strokeWidth="0.5" />
      {/* Star */}
      <path
        d="M32 20l2.5 5 5.5.8-4 3.9.9 5.3-4.9-2.6L27.1 35l.9-5.3-4-3.9 5.5-.8z"
        fill="#FFF9C4"
        opacity="0.7"
      />
    </svg>
  );
}

export function SeasonBanner({
  name,
  startDate,
  endDate,
  prize1stCents,
  prize2ndCents,
  prize3rdCents,
  prize4thCents,
  prize5thCents,
  prizeBonusCents,
  status,
  participantIds = [],
}: SeasonBannerProps) {
  const totalPrize = prize1stCents + prize2ndCents + prize3rdCents + prize4thCents + prize5thCents + prizeBonusCents;
  const [displayCents, setDisplayCents] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setMounted(true);
    const duration = 1200;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayCents(Math.round(eased * totalPrize));
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setShowConfetti(true);
      }
    }

    requestAnimationFrame(tick);
  }, [totalPrize]);

  const visibleAvatars = participantIds.slice(0, 5);
  const extraCount = participantIds.length - visibleAvatars.length;

  return (
    <Card
      className={`overflow-hidden border-primary/20 bg-gradient-to-br from-primary/8 via-transparent to-amber-500/8 transition-all duration-500 ${
        mounted ? "animate-glow-pulse" : ""
      }`}
    >
      <CardContent className="py-8 sm:py-10">
        <div
          className={`flex flex-col items-center text-center gap-4 ${
            mounted ? "animate-fade-up" : "opacity-0"
          }`}
        >
          {/* Prize pool — big, bold, animated */}
          <div className="relative">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="relative">
                <GoldTrophy
                  className={`h-12 w-12 sm:h-14 sm:w-14 drop-shadow-lg ${
                    mounted ? "animate-trophy-float" : ""
                  }`}
                />
                {showConfetti && <Confetti />}
              </div>
              <span
                className="text-6xl sm:text-7xl md:text-8xl font-extrabold font-mono bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-600 bg-clip-text text-transparent animate-shimmer drop-shadow-sm"
                style={{
                  backgroundSize: "200% auto",
                }}
              >
                {formatDollars(displayCents)}
              </span>
            </div>
            <p className="text-sm sm:text-base font-semibold text-muted-foreground uppercase tracking-[0.2em]">
              Prize Pool
            </p>
          </div>

          {/* Season info */}
          <div
            className={`flex flex-wrap items-center justify-center gap-3 text-sm sm:text-base text-muted-foreground ${
              mounted ? "animate-fade-up" : "opacity-0"
            }`}
            style={{ animationDelay: "0.2s" }}
          >
            <div className="flex items-center gap-1.5">
              <h2 className="font-semibold text-foreground text-base sm:text-lg">{name}</h2>
              {status === "LIVE" ? (
                <Badge
                  className={`gap-1 bg-green-600 hover:bg-green-700 ${
                    mounted ? "animate-scale-in" : "opacity-0"
                  }`}
                  style={{ animationDelay: "0.5s" }}
                >
                  <Zap className="h-3 w-3" />
                  {SEASON_STATUS_LABELS[status] || status}
                </Badge>
              ) : (
                <Badge variant="secondary">
                  {SEASON_STATUS_LABELS[status] || status}
                </Badge>
              )}
            </div>
            <span className="hidden sm:inline text-muted-foreground/40">|</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(startDate)} — {formatDate(endDate)}
            </span>
          </div>

          {/* Avatar stack */}
          {participantIds.length > 0 && (
            <div
              className={`flex items-center gap-2 ${
                mounted ? "animate-fade-up" : "opacity-0"
              }`}
              style={{ animationDelay: "0.4s" }}
            >
              <div className="flex -space-x-2">
                {visibleAvatars.map((id) => (
                  <div
                    key={id}
                    className="ring-2 ring-background rounded-full"
                  >
                    <UserAvatar userId={id} size="xs" />
                  </div>
                ))}
                {extraCount > 0 && (
                  <div className="flex items-center justify-center h-5 w-5 rounded-full bg-muted ring-2 ring-background text-[9px] font-bold text-muted-foreground">
                    +{extraCount}
                  </div>
                )}
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {participantIds.length} competing
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
