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
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-blue-500/5">
      <CardContent className="pt-4 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg">{name}</h2>
              {status === "LIVE" ? (
                <Badge className="gap-1 bg-green-600 hover:bg-green-700">
                  <Zap className="h-3 w-3" />
                  {SEASON_STATUS_LABELS[status] || status}
                </Badge>
              ) : (
                <Badge variant="secondary">
                  {SEASON_STATUS_LABELS[status] || status}
                </Badge>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(startDate)} — {formatDate(endDate)}
              </span>
              <span className="flex items-center gap-1 text-amber-500 font-medium">
                <Trophy className="h-3.5 w-3.5" />
                {formatDollars(totalPrize)} Prize Pool
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
