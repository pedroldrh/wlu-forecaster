"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDollars } from "@/lib/utils";
import { SEASON_STATUS_LABELS } from "@/lib/constants";
import { Calendar, Trophy, Zap } from "lucide-react";

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
}: SeasonBannerProps) {
  const totalPrize = prize1stCents + prize2ndCents + prize3rdCents + prize4thCents + prize5thCents + prizeBonusCents;
  const [displayCents, setDisplayCents] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const duration = 1200;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayCents(Math.round(eased * totalPrize));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [totalPrize]);

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
          <div>
            <div className="flex items-center justify-center gap-3 mb-2">
              <Trophy
                className={`h-10 w-10 sm:h-12 sm:w-12 text-amber-500 drop-shadow-lg ${
                  mounted ? "animate-trophy-float" : ""
                }`}
              />
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
        </div>
      </CardContent>
    </Card>
  );
}
