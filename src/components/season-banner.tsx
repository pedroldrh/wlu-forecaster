import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatCents } from "@/lib/utils";
import { SEASON_STATUS_LABELS } from "@/lib/constants";
import Link from "next/link";
import { Calendar, DollarSign } from "lucide-react";

interface SeasonBannerProps {
  id: string;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
  entryFeeCents: number;
  status: string;
  isPaid?: boolean;
  isAuthenticated?: boolean;
}

export function SeasonBanner({
  id,
  name,
  startDate,
  endDate,
  entryFeeCents,
  status,
  isPaid = false,
  isAuthenticated = false,
}: SeasonBannerProps) {
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
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(startDate)} — {formatDate(endDate)}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                {formatCents(entryFeeCents)} entry
              </span>
            </div>
          </div>
          {status === "LIVE" && (
            <div>
              {isPaid ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Entered
                </Badge>
              ) : isAuthenticated ? (
                <Button asChild>
                  <Link href={`/join/${id}`}>Join Season</Link>
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
