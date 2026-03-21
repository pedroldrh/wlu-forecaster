import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CountdownTimer } from "./countdown-timer";
import { CATEGORY_LABELS, getQuestionEmoji } from "@/lib/constants";
import { UsersThree, CheckCircle, XCircle } from "@phosphor-icons/react/ssr";

const CATEGORY_GRADIENTS: Record<string, string> = {
  SPORTS: "from-blue-500 to-blue-600",
  CAMPUS: "from-purple-500 to-purple-600",
  ACADEMICS: "from-amber-500 to-amber-600",
  GREEK: "from-emerald-500 to-emerald-600",
  LAW_SCHOOL: "from-red-500 to-red-600",
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
}: QuestionCardProps) {
  const gradient = CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS.OTHER;
  const emoji = getQuestionEmoji(title, category);

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
          {/* Title + resolution badge */}
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm leading-snug line-clamp-2">{title}</h3>
            </div>
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
            {userProbability !== null && userProbability !== undefined ? (
              <span className="flex items-center gap-1 text-green-500 font-medium">
                <CheckCircle className="h-3.5 w-3.5" weight="fill" />
                Voted
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
