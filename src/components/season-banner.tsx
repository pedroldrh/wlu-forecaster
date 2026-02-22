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

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-blue-500/5">
      <CardContent className="pt-6 pb-6">
        <div className="flex flex-col items-center text-center gap-3">
          {/* Prize pool — big and bold */}
          <div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <Trophy className="h-8 w-8 text-amber-500" />
              <span className="text-5xl sm:text-6xl font-extrabold font-mono bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                {formatDollars(totalPrize)}
              </span>
            </div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Prize Pool</p>
          </div>

          {/* Season info */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <h2 className="font-semibold text-foreground">{name}</h2>
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
            <span className="hidden sm:inline text-muted-foreground/40">|</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(startDate)} — {formatDate(endDate)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
