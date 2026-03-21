"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendUp } from "@phosphor-icons/react";

interface ScoreCardProps {
  wins: number;
  losses: number;
  hasBreakdown: boolean;
}

export function ScoreCard({ wins, losses, hasBreakdown }: ScoreCardProps) {
  function handleClick() {
    if (!hasBreakdown) return;
    document.getElementById("score-breakdown")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <Card
      className={hasBreakdown ? "cursor-pointer hover:border-primary/40 transition-colors" : ""}
      onClick={handleClick}
    >
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2">
          <TrendUp className="h-4 w-4 text-primary shrink-0" />
          <div>
            <p className="text-2xl font-bold font-mono">
              <span className="text-green-500">{wins}</span>
              <span className="text-muted-foreground mx-0.5">-</span>
              <span className="text-red-500">{losses}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Record{hasBreakdown ? " ↓" : ""}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
