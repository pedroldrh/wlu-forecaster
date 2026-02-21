import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CountdownTimer } from "./countdown-timer";
import { CATEGORY_LABELS, CATEGORY_COLORS, getQuestionEmoji } from "@/lib/constants";
import { Users, CheckCircle, XCircle } from "lucide-react";

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
}: QuestionCardProps) {
  const consensusPct = consensus !== null && consensus !== undefined
    ? Math.round(consensus * 100)
    : null;

  return (
    <Link href={`/questions/${id}`}>
      <Card className="hover:bg-muted/50 transition-colors h-full flex flex-col">
        <CardContent className="pt-4 pb-3 flex flex-col flex-1 gap-3">
          {/* Top: icon + title + consensus */}
          <div className="flex items-start gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 text-lg ${CATEGORY_COLORS[category] || CATEGORY_COLORS.OTHER}`}>
              {getQuestionEmoji(title, category)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm leading-snug line-clamp-2">{title}</h3>
              <span className="text-xs text-muted-foreground">
                {CATEGORY_LABELS[category] || category}
              </span>
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
                <Users className="h-3 w-3" />
                {forecastCount}
              </span>
              {status === "OPEN" && (
                <CountdownTimer targetDate={closeTime} className="text-xs" />
              )}
              {status === "CLOSED" && (
                <span className="text-yellow-500">Awaiting resolution</span>
              )}
            </div>
            {userProbability !== null && userProbability !== undefined ? (
              <span className="font-mono font-medium text-foreground">
                You: {Math.round(userProbability * 100)}%
              </span>
            ) : status === "OPEN" && (
              <span className="text-amber-500 font-medium">
                Vote
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
