"use client";

import { SwipeFeed } from "@/app/swipe/swipe-feed";

interface Market {
  id: string;
  title: string;
  category: string;
  description: string | null;
  imageUrl: string | null;
  voteCount: number;
}

interface HomeFeedProps {
  markets: Market[];
  isLoggedIn: boolean;
  seasonInfo: { name: string; totalPrizeCents: number } | null;
}

export function HomeFeed({ markets, isLoggedIn, seasonInfo }: HomeFeedProps) {
  return <SwipeFeed markets={markets} isLoggedIn={isLoggedIn} seasonInfo={seasonInfo} />;
}
