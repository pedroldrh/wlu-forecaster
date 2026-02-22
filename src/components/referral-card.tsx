"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check } from "lucide-react";

interface ReferralCardProps {
  userId: string;
  referralCount: number;
}

export function ReferralCard({ userId, referralCount }: ReferralCardProps) {
  const [copied, setCopied] = useState(false);
  const capped = Math.min(referralCount, 3);
  const link = `${typeof window !== "undefined" ? window.location.origin : ""}/?ref=${userId}`;

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Forecaster",
          text: "Make predictions on campus events and win prizes!",
          url: link,
        });
        return;
      } catch {
        // User cancelled or share failed, fall through to copy
      }
    }

    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tell Your Friends</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Share your link — earn +1 bonus point for each friend who joins (max 3).
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{capped}/3 referrals</span>
          <Button size="sm" onClick={handleShare} className="gap-2">
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                {typeof navigator !== "undefined" && "share" in navigator ? (
                  <Share2 className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                Share link
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
