import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CountdownTimer } from "./countdown-timer";
import { CATEGORY_LABELS } from "@/lib/constants";
import { Users } from "lucide-react";

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
  return (
    <Link href={`/questions/${id}`}>
      <Card className="hover:bg-muted/50 transition-colors">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {CATEGORY_LABELS[category] || category}
                </Badge>
                {status === "RESOLVED" && (
                  <Badge
                    variant={resolvedOutcome ? "default" : "secondary"}
                  >
                    {resolvedOutcome ? "YES" : "NO"}
                  </Badge>
                )}
                {status === "CLOSED" && (
                  <Badge variant="secondary">Awaiting Resolution</Badge>
                )}
              </div>
              <h3 className="font-medium leading-snug">{title}</h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {forecastCount} forecast{forecastCount !== 1 ? "s" : ""}
                </span>
                {status === "OPEN" && (
                  <CountdownTimer
                    targetDate={closeTime}
                    className="text-xs"
                  />
                )}
              </div>
            </div>
            {userProbability !== null && userProbability !== undefined && (
              <div className="text-right shrink-0">
                <div className="text-lg font-mono font-bold">
                  {Math.round(userProbability * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">Your forecast</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
