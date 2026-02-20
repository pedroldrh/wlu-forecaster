import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDollars } from "@/lib/utils";
import { SEASON_STATUS_LABELS } from "@/lib/constants";
import { Calendar, Trophy } from "lucide-react";

interface SeasonBannerProps {
  id: string;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
  prize1stCents: number;
  prize2ndCents: number;
  prize3rdCents: number;
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
  prizeBonusCents,
  status,
}: SeasonBannerProps) {
  const totalPrize = prize1stCents + prize2ndCents + prize3rdCents + prizeBonusCents;

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg">{name}</h2>
              <Badge
                variant={status === "LIVE" ? "default" : "secondary"}
              >
                {SEASON_STATUS_LABELS[status] || status}
              </Badge>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(startDate)} — {formatDate(endDate)}
              </span>
              <span className="flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5" />
                Prize Pool: {formatDollars(totalPrize)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
