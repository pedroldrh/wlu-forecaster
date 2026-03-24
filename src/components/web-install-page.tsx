"use client";

import { useState, useEffect, useMemo } from "react";
import { ForecasterLogo } from "@/components/forecaster-logo";
import { DownloadSimple } from "@phosphor-icons/react";
import { formatDollars } from "@/lib/utils";

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

  // Force black on body + theme-color so iOS status bar is black
  useEffect(() => {
    document.body.style.backgroundColor = "#000";
  }, []);

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
    <div className="fixed -inset-1 flex flex-col items-center justify-center px-6 text-white z-50" style={{ background: "linear-gradient(to bottom, #000000 0%, #1a1a4e 8%, #2d3a8c 30%, #3b5fc0 50%, #2d3a8c 70%, #1a1a4e 92%, #000000 100%)" }}>
      {/* Install card — top */}
      <div className="w-full max-w-sm bg-white/10 backdrop-blur-lg rounded-2xl p-6 space-y-4 mb-8 animate-fade-up">
        <h2 className="font-bold text-lg text-center flex items-center justify-center gap-2">
          <DownloadSimple className="h-5 w-5" weight="bold" />
          Install the App
        </h2>

        <div className="space-y-3">
          {platform === "ios" && (
            <>
              <Step num={1}>Tap the <strong>⋯</strong> at the bottom-right of Safari</Step>
              <Step num={2}>Tap the <strong>Share</strong> button</Step>
              <Step num={3}>Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong></Step>
              <Step num={4}>Tap <strong>&quot;Add&quot;</strong> in the top-right — done!</Step>
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

      {/* Prize pool — below install */}
      {seasonInfo && seasonInfo.totalPrizeCents > 0 && (
        <div className="flex flex-col items-center animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <span className="text-7xl sm:text-8xl font-extrabold font-mono bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent leading-none">
            {formatDollars(seasonInfo.totalPrizeCents)}
          </span>
          <span className="text-white/50 text-sm font-semibold uppercase tracking-widest mt-3">
            Prize Pool
          </span>
        </div>
      )}

      {/* Logo + Title — bottom */}
      <div className="flex items-center gap-3 mt-8 mb-3 animate-fade-up" style={{ animationDelay: "0.4s" }}>
        <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
          <ForecasterLogo className="h-8 w-8 text-white" />
        </div>
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-1 animate-fade-up" style={{ animationDelay: "0.4s" }}>
        Forecaster
      </h1>
      <p className="text-white/60 text-center text-sm max-w-xs animate-fade-up" style={{ animationDelay: "0.5s" }}>
        W&L Campus Predictions — vote on markets, build your record, win real money.
      </p>
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
