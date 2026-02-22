"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { formatPercent } from "@/lib/utils";

interface ScoreCardProps {
  score: number;
  hasBreakdown: boolean;
}

export function ScoreCard({ score, hasBreakdown }: ScoreCardProps) {
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
          <TrendingUp className="h-4 w-4 text-primary shrink-0" />
          <div>
            <p className="text-2xl font-bold font-mono">{formatPercent(score)}</p>
            <p className="text-xs text-muted-foreground">
              Avg Score{hasBreakdown ? " ↓" : ""}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
