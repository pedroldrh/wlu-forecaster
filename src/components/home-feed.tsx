"use client";

import { useState, useEffect } from "react";
import { SwipeFeed } from "@/app/swipe/swipe-feed";
import { WebInstallPage } from "@/components/web-install-page";

function isPWA() {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

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
  const [isPwaMode, setIsPwaMode] = useState(true); // default true to avoid flash

  useEffect(() => {
    setIsPwaMode(isPWA());
  }, []);

  if (!isPwaMode) {
    return <WebInstallPage seasonInfo={seasonInfo} />;
  }

  return <SwipeFeed markets={markets} isLoggedIn={isLoggedIn} seasonInfo={seasonInfo} />;
}
