"use client";

import { useEffect, useState } from "react";
import { Copy, Check } from "@phosphor-icons/react";
import { ForecasterLogo } from "@/components/forecaster-logo";
import { Button } from "@/components/ui/button";

function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || navigator.vendor || "";
  return /snapchat|FBAN|FBAV|Instagram|Twitter|LinkedInApp|BytedanceWebview|TikTok|musical_ly/i.test(ua);
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function getAppName(): string {
  if (typeof navigator === "undefined") return "";
  const ua = navigator.userAgent || "";
  if (/snapchat/i.test(ua)) return "Snapchat";
  if (/Instagram/i.test(ua)) return "Instagram";
  if (/FBAN|FBAV/i.test(ua)) return "Facebook";
  if (/Twitter/i.test(ua)) return "Twitter";
  if (/TikTok|musical_ly|BytedanceWebview/i.test(ua)) return "TikTok";
  if (/LinkedInApp/i.test(ua)) return "LinkedIn";
  return "this app";
}

export function InAppBrowserGate() {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setShow(isInAppBrowser());
  }, []);

  if (!show) return null;

  const url = window.location.href;
  const browser = isIOS() ? "Safari" : "Chrome";
  const appName = getAppName();

  const handleCopy = async () => {
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
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-sm w-full space-y-6">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <ForecasterLogo className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
            Forecaster
          </span>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-lg font-semibold">Open in {browser} to continue</h1>
          <p className="text-sm text-muted-foreground">
            {appName}&apos;s browser can&apos;t run this app. Copy the link below and paste it in {browser}.
          </p>
        </div>

        {/* Link display */}
        <div className="rounded-lg border bg-muted/50 px-4 py-3">
          <p className="text-sm font-mono text-foreground break-all">{url}</p>
        </div>

        {/* Copy button */}
        <Button className="w-full gap-2" size="lg" onClick={handleCopy}>
          {copied ? (
            <>
              <Check className="h-5 w-5" />
              Copied! Now paste in {browser}
            </>
          ) : (
            <>
              <Copy className="h-5 w-5" />
              Copy Link
            </>
          )}
        </Button>

        {/* Steps */}
        <div className="text-sm text-muted-foreground space-y-2 pt-2">
          <p className="font-medium text-foreground text-xs uppercase tracking-wider">Steps</p>
          <ol className="list-decimal list-inside space-y-1.5 text-left">
            <li>Tap <strong className="text-foreground">Copy Link</strong> above</li>
            <li>Open <strong className="text-foreground">{browser}</strong></li>
            <li>Paste the link in the address bar</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
