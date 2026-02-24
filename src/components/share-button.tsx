"use client";

import { useState } from "react";
import { ShareNetwork, Check } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled or share failed — fall through to copy
      }
    }

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Copied!
        </>
      ) : (
        <>
          <ShareNetwork className="h-4 w-4" />
          Share
        </>
      )}
    </Button>
  );
}
