"use client";

import { useState, useEffect } from "react";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { SeasonBanner } from "@/components/season-banner";
import { createClient } from "@/lib/supabase/client";
import { useSwipeNav } from "@/lib/use-swipe-nav";
import { SwipePeek } from "@/components/swipe-peek";

// In-memory cache for instant revisits
let cachedData: any = null;

export default function LeaderboardPage() {
  const [data, setData] = useState<any>(cachedData);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const { containerRef, swipeStyle, peekLabel } = useSwipeNav({
    leftHref: "/",
    leftLabel: "Feed",
  });

  useEffect(() => {
    // Get current user for "You" badge
    createClient().auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });

    fetch("/api/leaderboard", { cache: "no-store" }).then((r) => r.json()).then((d) => {
      cachedData = d;
      setData(d);
    });
  }, []);

  if (!data) return <div className="min-h-screen" />;
  if (!data.season) return <div className="text-center py-12 text-muted-foreground">No active season found.</div>;

  const entries = (data.entries ?? []).map((e: any) => ({
    ...e,
    isCurrentUser: e.userId === currentUserId,
  }));

  return (
    <div ref={containerRef} className="relative">
      <SwipePeek label={peekLabel} />
      <div style={swipeStyle}>
    <div className="space-y-6 pb-24">
      <SeasonBanner
        id={data.season.id}
        name={data.season.name}
        startDate={data.season.startDate}
        endDate={data.season.endDate}
        prize1stCents={data.season.prize1stCents}
        prize2ndCents={data.season.prize2ndCents}
        prize3rdCents={data.season.prize3rdCents}
        prize4thCents={data.season.prize4thCents}
        prize5thCents={data.season.prize5thCents}
        prizeBonusCents={data.season.prizeBonusCents}
        status={data.season.status}
        participantIds={data.participantIds}
      />

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {data.resolvedCount} question{data.resolvedCount !== 1 ? "s" : ""} resolved
        </p>
      </div>

      <LeaderboardTable entries={entries} />
    </div>
      </div>
    </div>
  );
}
