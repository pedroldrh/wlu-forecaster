"use client";

import { SwipeFeed } from "@/app/swipe/swipe-feed";

interface HomeFeedProps {
  marketsJson: string;
  seasonInfoJson: string;
}

export function HomeFeed({ marketsJson, seasonInfoJson }: HomeFeedProps) {
  const markets = JSON.parse(marketsJson);
  const seasonInfo = JSON.parse(seasonInfoJson);
  return <SwipeFeed initialMarkets={markets} initialSeasonInfo={seasonInfo} />;
}
