import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn, formatPercent, formatDollars } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";
import Link from "next/link";
import { Trophy } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  image?: string | null;
  score: number;
  questionsPlayed: number;
  isCurrentUser?: boolean;
  participationPct?: number;
  qualifiesForPrize?: boolean;
  prizeCents?: number;
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

  const showParticipation = entries.some((e) => e.participationPct !== undefined);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Rank</TableHead>
          <TableHead>Player</TableHead>
          <TableHead className="text-right">Score</TableHead>
          <TableHead className="text-right hidden sm:table-cell">Questions</TableHead>
          {showParticipation && <TableHead className="text-right hidden md:table-cell">Markets</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow
            key={entry.userId}
            className={cn(
              entry.isCurrentUser && "bg-muted/50",
              entry.qualifiesForPrize === false && "opacity-60"
            )}
          >
            <TableCell className="font-mono">
              {entry.rank <= 3 ? (
                <span className="flex items-center gap-1">
                  <Trophy
                    className={cn(
                      "h-4 w-4",
                      entry.rank === 1 && "text-yellow-500",
                      entry.rank === 2 && "text-gray-400",
                      entry.rank === 3 && "text-amber-700"
                    )}
                  />
                  {entry.rank}
                  {entry.prizeCents ? (
                    <span className="text-xs text-green-600 ml-1">
                      {formatDollars(entry.prizeCents)}
                    </span>
                  ) : null}
                </span>
              ) : (
                entry.rank
              )}
            </TableCell>
            <TableCell>
              <Link
                href={`/u/${entry.userId}`}
                className="flex items-center gap-2 hover:underline min-w-0"
              >
                <UserAvatar avatarUrl={entry.image} userId={entry.userId} size="xs" className="shrink-0" />
                <span className="font-medium truncate">{entry.name}</span>
                {entry.isCurrentUser && (
                  <Badge variant="outline" className="text-xs shrink-0">
                    You
                  </Badge>
                )}
                {entry.qualifiesForPrize === false && (
                  <Badge variant="secondary" className="text-xs shrink-0 hidden sm:inline-flex">
                    Not qualified
                  </Badge>
                )}
              </Link>
            </TableCell>
            <TableCell className="text-right font-mono">
              {formatPercent(entry.score)}
            </TableCell>
            <TableCell className="text-right hidden sm:table-cell">{entry.questionsPlayed}</TableCell>
            {showParticipation && (
              <TableCell className="text-right text-sm hidden md:table-cell">
                {entry.questionsPlayed}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
