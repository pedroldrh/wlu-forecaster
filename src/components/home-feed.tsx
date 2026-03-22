"use client";

import { SwipeFeed } from "@/app/swipe/swipe-feed";

interface Market {
  id: string;
  title: string;
  category: string;
  imageUrl: string | null;
  closeTime: string;
  voteCount: number;
  userVote: boolean | null;
  comments: { content: string; display_name: string }[];
}

interface HomeFeedProps {
  markets: Market[];
  isLoggedIn: boolean;
  seasonInfo: { name: string; totalPrizeCents: number } | null;
}

export function HomeFeed({ markets, isLoggedIn, seasonInfo }: HomeFeedProps) {
  return <SwipeFeed markets={markets} isLoggedIn={isLoggedIn} seasonInfo={seasonInfo} />;
}
