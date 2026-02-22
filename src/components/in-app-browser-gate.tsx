"use client";

import { useEffect, useState } from "react";
import { BarChart3, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || navigator.vendor || "";
  // Snapchat, Instagram, Facebook, Twitter, LinkedIn, TikTok, etc.
  return /snapchat|FBAN|FBAV|Instagram|Twitter|LinkedInApp|BytedanceWebview|TikTok|musical_ly/i.test(ua);
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function InAppBrowserGate() {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setShow(isInAppBrowser());
  }, []);

  if (!show) return null;

  const url = window.location.href;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenInBrowser = () => {
    // On iOS, try to open in Safari via x-safari scheme or window.open
    if (isIOS()) {
      // This sometimes works to escape in-app browsers on iOS
      window.location.href = url;
    } else {
      // On Android, intent:// can open the default browser
      const intentUrl = `intent://${url.replace(/^https?:\/\//, "")}#Intent;scheme=https;end`;
      window.location.href = intentUrl;
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-sm w-full space-y-6">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
            Forecaster
          </span>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-lg font-semibold">Open in {isIOS() ? "Safari" : "your browser"}</h1>
          <p className="text-sm text-muted-foreground">
            This app works best in {isIOS() ? "Safari" : "Chrome"}. Tap the button below to open it, or copy the link and paste it in your browser.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button className="w-full gap-2" size="lg" onClick={handleOpenInBrowser}>
            <ExternalLink className="h-4 w-4" />
            Open in {isIOS() ? "Safari" : "Browser"}
          </Button>

          <Button variant="outline" className="w-full" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy Link"}
          </Button>
        </div>

        {/* Manual instructions */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2">
          <p className="font-medium text-foreground">Or manually:</p>
          {isIOS() ? (
            <p>Tap the <strong className="text-foreground">&#8943;</strong> menu &rarr; <strong className="text-foreground">Open in Safari</strong></p>
          ) : (
            <p>Tap the <strong className="text-foreground">&#8942;</strong> menu &rarr; <strong className="text-foreground">Open in Browser</strong></p>
          )}
        </div>
      </div>
    </div>
  );
}
