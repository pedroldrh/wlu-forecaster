import { Badge } from "@/components/ui/badge";
import { cn, formatPercent, formatDollars } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";
import Link from "next/link";
import { Trophy } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  score: number;
  questionsPlayed: number;
  isCurrentUser?: boolean;
  participationPct?: number;
  qualifiesForPrize?: boolean;
  prizeCents?: number;
  referralBonus?: number;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No entries yet. Join the season to compete!
      </p>
    );
  }

  return (
    <div className="divide-y">
      {entries.map((entry) => (
        <Link
          key={entry.userId}
          href={`/u/${entry.userId}`}
          className={cn(
            "flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-primary/5 transition-colors",
            entry.isCurrentUser && "bg-muted/50",
            entry.qualifiesForPrize === false && "opacity-60"
          )}
        >
          {/* Rank */}
          <div className="w-8 shrink-0 text-center font-mono text-sm">
            {entry.rank <= 3 ? (
              <Trophy
                className={cn(
                  "h-5 w-5 mx-auto",
                  entry.rank === 1 && "text-yellow-500",
                  entry.rank === 2 && "text-gray-400",
                  entry.rank === 3 && "text-amber-700"
                )}
              />
            ) : (
              <span className="text-muted-foreground">{entry.rank}</span>
            )}
          </div>

          {/* Avatar */}
          <UserAvatar userId={entry.userId} size="sm" className="shrink-0" />

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-sm truncate">{entry.name}</span>
              {entry.isCurrentUser && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                  You
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{entry.questionsPlayed} question{entry.questionsPlayed !== 1 ? "s" : ""}</span>
              {entry.prizeCents ? (
                <span className="text-green-600 font-medium">{formatDollars(entry.prizeCents)}</span>
              ) : null}
              {entry.qualifiesForPrize === false && (
                <span className="text-yellow-600">Not qualified</span>
              )}
            </div>
          </div>

          {/* Score */}
          <div className="shrink-0 text-right">
            <div className="text-base font-bold font-mono">{formatPercent(entry.score)}</div>
            {entry.referralBonus ? (
              <div className="text-[10px] text-green-600" title="Referral bonus">+{entry.referralBonus} ref</div>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  );
}
