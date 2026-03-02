"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CountdownTimer } from "./countdown-timer";
import { CATEGORY_LABELS, getQuestionEmoji } from "@/lib/constants";
import { UsersThree, CheckCircle, XCircle } from "@phosphor-icons/react/ssr";
import { submitForecast } from "@/actions/forecasts";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

const CATEGORY_GRADIENTS: Record<string, string> = {
  SPORTS: "from-blue-500 to-blue-600",
  CAMPUS: "from-purple-500 to-purple-600",
  ACADEMICS: "from-amber-500 to-amber-600",
  GREEK: "from-emerald-500 to-emerald-600",
  OTHER: "from-zinc-500 to-zinc-600",
};

interface QuestionCardProps {
  id: string;
  title: string;
  category: string;
  status: string;
  closeTime: Date | string;
  forecastCount: number;
  resolvedOutcome?: boolean | null;
  userProbability?: number | null;
  consensus?: number | null;
  canQuickForecast?: boolean;
}

export function QuestionCard({
  id,
  title,
  category,
  status,
  closeTime,
  forecastCount,
  resolvedOutcome,
  userProbability,
  consensus,
  canQuickForecast = false,
}: QuestionCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localUserProbability, setLocalUserProbability] = useState(userProbability ?? null);
  const consensusPct = consensus !== null && consensus !== undefined
    ? Math.round(consensus * 100)
    : null;

  const gradient = CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS.OTHER;
  const emoji = getQuestionEmoji(title, category);
  const canShowQuickVote = status === "OPEN" && localUserProbability === null && canQuickForecast;

  const handleQuickVote = (pct: number, e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      try {
        await submitForecast(id, pct / 100);
        setLocalUserProbability(pct / 100);
        toast.success(`Forecast saved at ${pct}%`);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to submit forecast");
      }
    });
  };

  return (
    <Link href={`/questions/${id}`}>
      <Card className="h-full flex flex-col transition-all duration-200 hover:border-primary/30 md:hover:scale-[1.02] md:hover:-translate-y-0.5 md:hover:shadow-lg md:hover:shadow-primary/10 overflow-hidden !pt-0 !gap-0">
        {/* Category header banner */}
        <div className={`relative h-14 bg-gradient-to-r ${gradient} flex items-center justify-between px-4`}>
          <span className="text-sm font-bold text-white uppercase tracking-wider">
            {CATEGORY_LABELS[category] || category}
          </span>
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-5xl opacity-90 select-none pointer-events-none" aria-hidden="true">
            {emoji}
          </span>
        </div>

        <CardContent className="pt-3 pb-3 flex flex-col flex-1 gap-3">
          {/* Title + consensus */}
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm leading-snug line-clamp-2">{title}</h3>
            </div>
            {consensusPct !== null && status !== "RESOLVED" && (
              <div className="shrink-0 flex flex-col items-center">
                <div className="text-xl font-bold font-mono text-primary">{consensusPct}%</div>
                <span className="text-[10px] text-muted-foreground">chance</span>
              </div>
            )}
            {status === "RESOLVED" && (
              <div className="shrink-0 flex items-center gap-1">
                {resolvedOutcome ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" /> YES
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <XCircle className="h-3 w-3" /> NO
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bottom row: metadata */}
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <UsersThree className="h-3 w-3" />
                {forecastCount}
              </span>
              {status === "OPEN" && (
                <CountdownTimer targetDate={closeTime} className="text-xs" />
              )}
              {status === "CLOSED" && (
                <span className="text-yellow-500">Awaiting resolution</span>
              )}
            </div>
            {localUserProbability !== null && localUserProbability !== undefined ? (
              <span className="font-mono font-medium text-foreground">
                You: {Math.round(localUserProbability * 100)}%
              </span>
            ) : status === "OPEN" && (
              <span className="text-amber-500 font-medium">
                Vote
              </span>
            )}
          </div>

          {canShowQuickVote && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Quick vote:</span>
              {[20, 50, 80].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={(e) => handleQuickVote(pct, e)}
                  disabled={isPending}
                  className="rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors disabled:opacity-50"
                >
                  {pct}%
                </button>
              ))}
              <span className="text-[11px] text-primary/80 ml-auto">Tap card for full slider</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
