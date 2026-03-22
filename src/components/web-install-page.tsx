"use client";

import { useState, useEffect, useMemo } from "react";
import { ForecasterLogo } from "@/components/forecaster-logo";
import { DownloadSimple, Trophy } from "@phosphor-icons/react";
import { formatDollars } from "@/lib/utils";
import Link from "next/link";

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

interface WebInstallPageProps {
  seasonInfo: { name: string; totalPrizeCents: number } | null;
}

export function WebInstallPage({ seasonInfo }: WebInstallPageProps) {
  const platform = useMemo(detectPlatform, []);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  async function handleDirectInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-blue-600 via-blue-500 to-indigo-700 flex flex-col items-center justify-center px-6 text-white z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-6 animate-fade-up">
        <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
          <ForecasterLogo className="h-8 w-8 text-white" />
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-1 animate-fade-up">
        Forecaster
      </h1>
      <p className="text-white/60 text-center text-sm max-w-xs mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
        W&L Campus Predictions — vote on markets, build your record, win real money.
      </p>

      {/* Prize pool pill */}
      {seasonInfo && seasonInfo.totalPrizeCents > 0 && (
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-5 py-2.5 mb-8 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <Trophy className="h-5 w-5 text-amber-300" weight="fill" />
          <span className="font-bold text-lg font-mono">{formatDollars(seasonInfo.totalPrizeCents)}</span>
          <span className="text-white/50 text-sm">prize pool</span>
        </div>
      )}

      {/* Install card */}
      <div className="w-full max-w-sm bg-white/10 backdrop-blur-lg rounded-2xl p-6 space-y-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
        <h2 className="font-bold text-lg text-center flex items-center justify-center gap-2">
          <DownloadSimple className="h-5 w-5" weight="bold" />
          Install the App
        </h2>

        <div className="space-y-3">
          {platform === "ios" && (
            <>
              <Step num={1}>Tap the <strong>Share</strong> button at the bottom of Safari</Step>
              <Step num={2}>Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong></Step>
              <Step num={3}>Tap <strong>&quot;Add&quot;</strong> in the top-right — done!</Step>
              <p className="text-xs text-white/40 italic pt-1">
                On some iOS versions, tap the ⋯ menu first, then Share.
              </p>
            </>
          )}
          {platform === "android" && (
            <>
              <Step num={1}>Tap <strong>⋮</strong> at the top-right of Chrome</Step>
              <Step num={2}>Tap <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong></Step>
              <Step num={3}>Tap <strong>&quot;Install&quot;</strong> — done!</Step>
            </>
          )}
          {platform === "desktop" && (
            <>
              <Step num={1}>Look for the <strong>install icon</strong> in the address bar</Step>
              <Step num={2}>Click <strong>&quot;Install&quot;</strong> — done!</Step>
              <p className="text-xs text-white/40 italic pt-1">
                Or open the browser menu and look for &quot;Install Forecaster&quot;.
              </p>
            </>
          )}
        </div>

        {deferredPrompt && (
          <button
            onClick={handleDirectInstall}
            className="w-full bg-white text-blue-600 font-bold rounded-full py-3 text-sm hover:bg-white/90 active:scale-[0.97] transition-all"
          >
            Install Now
          </button>
        )}
      </div>

      <p className="text-white/30 text-xs mt-6 text-center max-w-xs">
        Install for push notifications, instant access & the full experience.
      </p>

      <Link href="/signin" className="text-white/40 text-xs mt-4 hover:text-white/60 transition-colors underline">
        Already have it? Sign in
      </Link>
    </div>
  );
}

function Step({ num, children }: { num: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="flex-shrink-0 h-6 w-6 rounded-full bg-white/20 text-white text-xs font-bold flex items-center justify-center">
        {num}
      </span>
      <p className="text-sm text-white/80 leading-relaxed">{children}</p>
    </div>
  );
}
