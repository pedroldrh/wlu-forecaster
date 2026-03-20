"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatDollars } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";
import { AnimatedNumber } from "@/components/animated-number";
import Link from "next/link";
import { Crown, Trophy } from "@phosphor-icons/react";

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
  scoreDelta?: number;
  isFounder?: boolean;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

const PODIUM_CONFIG = {
  1: {
    gradient: "from-yellow-500/20 via-amber-500/10 to-transparent",
    border: "border-yellow-500/30 hover:border-yellow-500/50",
    color: "text-yellow-500",
    ring: "ring-2 ring-yellow-500/30",
    label: "1st",
  },
  2: {
    gradient: "from-zinc-400/15 via-zinc-300/10 to-transparent",
    border: "border-zinc-400/30 hover:border-zinc-400/50",
    color: "text-zinc-400",
    ring: "ring-2 ring-zinc-400/25",
    label: "2nd",
  },
  3: {
    gradient: "from-amber-700/15 via-amber-600/10 to-transparent",
    border: "border-amber-700/30 hover:border-amber-700/50",
    color: "text-amber-700",
    ring: "ring-2 ring-amber-700/25",
    label: "3rd",
  },
} as const;

function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  // Render order: 2nd, 1st, 3rd for classic podium layout
  const order = [entries[1], entries[0], entries[2]];
  const ranks = [2, 1, 3] as const;

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end">
      {order.map((entry, i) => {
        const rank = ranks[i];
        const c = PODIUM_CONFIG[rank];
        const isFirst = rank === 1;

        return (
          <Link key={entry.userId} href={`/u/${entry.userId}`} className="block">
            <Card className={cn(
              "relative overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]",
              c.border,
              `bg-gradient-to-b ${c.gradient}`,
              entry.isCurrentUser && "ring-2 ring-primary/40"
            )}>
              <CardContent className={cn(
                "flex flex-col items-center text-center px-2 sm:px-3",
                isFirst ? "pt-4 pb-2" : "pt-3 pb-1.5"
              )}>
                <span className={cn("text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1.5", c.color)}>
                  {c.label}
                </span>
                <UserAvatar
                  userId={entry.userId}
                  size={isFirst ? "lg" : "md"}
                  className={cn(isFirst && "h-10 w-10", c.ring, "mb-1.5")}
                />
                <div className="flex items-center gap-1 max-w-full">
                  {entry.isFounder && <Crown className="h-3 w-3 text-amber-500 shrink-0" weight="fill" />}
                  <span className={cn("font-semibold text-center leading-tight", isFirst ? "text-sm" : "text-xs")}>
                    {entry.name}
                  </span>
                </div>
                {entry.isCurrentUser && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0 mt-0.5 border-primary/40 text-primary">You</Badge>
                )}
                <div className={cn(
                  "font-bold font-mono mt-1",
                  isFirst ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl",
                  c.color
                )}>
                  <AnimatedNumber value={entry.score * 100} suffix="%" />
                </div>
                {entry.prizeCents && (
                  <span className="text-[10px] sm:text-xs text-green-500 font-medium mt-0.5">
                    {formatDollars(entry.prizeCents)} prize
                  </span>
                )}
                <span className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">
                  {entry.questionsPlayed} prediction{entry.questionsPlayed !== 1 ? "s" : ""}
                </span>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

function YourRankBanner({ entry }: { entry: LeaderboardEntry }) {
  return (
    <Link href={`/u/${entry.userId}`} className="block max-w-sm mx-auto">
      <Card className="border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors">
        <CardContent className="flex items-center gap-2.5 py-2.5 px-3">
          <span className="text-sm font-mono font-bold text-primary w-7 text-center">#{entry.rank}</span>
          <UserAvatar userId={entry.userId} size="sm" className="shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium truncate">{entry.name}</span>
          </div>
          <div className="text-right shrink-0">
            <div className="font-bold font-mono text-primary">
              <AnimatedNumber value={entry.score * 100} suffix="%" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No entries yet. Join the season to compete!
      </p>
    );
  }

  const hasPodium = entries.length >= 3;
  const restEntries = hasPodium ? entries.slice(3) : entries;

  return (
    <div className="space-y-4">
      {hasPodium && <Podium entries={entries} />}

      {restEntries.length > 0 && (
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="divide-y">
              {restEntries.map((entry) => (
                <Link
                  key={entry.userId}
                  href={`/u/${entry.userId}`}
                  className={cn(
                    "flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors",
                    entry.isCurrentUser && "bg-primary/5 hover:bg-primary/10"
                  )}
                >
                  <div className="w-7 shrink-0 text-center">
                    {!hasPodium && entry.rank <= 3 ? (
                      <Trophy
                        className={cn(
                          "h-5 w-5 mx-auto",
                          entry.rank === 1 && "text-yellow-500",
                          entry.rank === 2 && "text-gray-400",
                          entry.rank === 3 && "text-amber-700"
                        )}
                        weight="fill"
                      />
                    ) : (
                      <span className={cn(
                        "text-sm font-mono font-bold",
                        entry.rank <= 5 ? "text-primary" : "text-muted-foreground"
                      )}>
                        {entry.rank}
                      </span>
                    )}
                  </div>
                  <UserAvatar userId={entry.userId} size="sm" className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {entry.isFounder && <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" weight="fill" />}
                      <span className="font-medium text-sm truncate">{entry.name}</span>
                      {entry.isFounder && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0 bg-amber-500/10 text-amber-600 border-amber-500/20">
                          Founder
                        </Badge>
                      )}
                      {entry.isCurrentUser && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 border-primary/40 text-primary">
                          You
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{entry.questionsPlayed} prediction{entry.questionsPlayed !== 1 ? "s" : ""}</span>
                      {entry.prizeCents ? (
                        <span className="text-green-500 font-medium">{formatDollars(entry.prizeCents)}</span>
                      ) : null}
                      {entry.qualifiesForPrize === false && (
                        <span className="text-amber-500">Not qualified</span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-bold font-mono">
                      <AnimatedNumber value={entry.score * 100} suffix="%" />
                    </div>
                    {entry.scoreDelta != null && (
                      <div className="text-[10px] text-green-500 font-medium animate-in fade-in slide-in-from-bottom-1 duration-500">
                        +{entry.scoreDelta.toFixed(1)} pts
                      </div>
                    )}
                    {entry.referralBonus ? (
                      <div className="text-[10px] text-green-500" title="Referral bonus">+{entry.referralBonus} ref</div>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
