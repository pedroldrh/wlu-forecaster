"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X, DownloadSimple } from "@phosphor-icons/react";
import { ForecasterLogo } from "@/components/forecaster-logo";
import { createClient } from "@/lib/supabase/client";

function isPWA() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v13M5 12l7-7 7 7" />
      <rect x="3" y="17" width="18" height="4" rx="1" fill="none" />
    </svg>
  );
}

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (isPWA()) return;

    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) return;

      const dismissedAt = localStorage.getItem("install-prompt-dismissed");
      if (dismissedAt && Date.now() - Number(dismissedAt) < 2 * 60 * 1000) {
        const remaining = 2 * 60 * 1000 - (Date.now() - Number(dismissedAt));
        const timer = setTimeout(() => setShow(true), remaining);
        return () => clearTimeout(timer);
      }

      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    });

    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  if ((!show && !showModal) || pathname === "/signin") return null;

  function handleDismiss() {
    localStorage.setItem("install-prompt-dismissed", String(Date.now()));
    setShow(false);
    setShowModal(false);
    setTimeout(() => setShow(true), 2 * 60 * 1000);
  }

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setShow(false);
    } else if (isIOS()) {
      setShowModal(true);
    }
  }

  // iOS instruction modal
  if (showModal) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-sm w-full space-y-6">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <ForecasterLogo className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-foreground">Install Forecaster</h1>
            <p className="text-sm text-muted-foreground">
              Add Forecaster to your home screen for the full app experience — faster loading, fullscreen, and push notifications.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4 text-left">
            <div className="flex items-start gap-4 rounded-xl border bg-card p-4">
              <span className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">1</span>
              <div>
                <p className="text-sm font-semibold text-foreground">Tap the Share button</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tap <ShareIcon className="h-4 w-4 inline text-primary -mt-0.5" /> at the bottom of Safari
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-xl border bg-card p-4">
              <span className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">2</span>
              <div>
                <p className="text-sm font-semibold text-foreground">Tap &quot;Add to Home Screen&quot;</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Scroll down in the share menu and tap <strong className="text-foreground">Add to Home Screen</strong>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-xl border bg-card p-4">
              <span className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">3</span>
              <div>
                <p className="text-sm font-semibold text-foreground">Tap &quot;Add&quot;</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Forecaster will appear on your home screen like a regular app
                </p>
              </div>
            </div>
          </div>

          {/* Close */}
          <button
            onClick={handleDismiss}
            className="w-full flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            Maybe later
          </button>
        </div>
      </div>
    );
  }

  // Banner
  return (
    <div className="fixed bottom-20 md:bottom-4 inset-x-0 z-40 px-4 animate-fade-up">
      <div className="max-w-sm mx-auto bg-card border rounded-2xl shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div
            className="shrink-0 h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center cursor-pointer"
            onClick={handleInstall}
          >
            <ForecasterLogo className="h-6 w-6 text-white" />
          </div>

          <div className="flex-1 min-w-0 cursor-pointer" onClick={handleInstall}>
            <p className="text-sm font-semibold text-foreground">Get the Forecaster app</p>
            {isIOS() ? (
              <p className="text-xs text-muted-foreground mt-0.5">
                Tap here for install instructions
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">
                Install for the best experience — faster, fullscreen, notifications.
              </p>
            )}
          </div>

          <button
            onClick={handleDismiss}
            className="shrink-0 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!isIOS() && deferredPrompt && (
          <button
            onClick={handleInstall}
            className="w-full mt-3 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold text-sm rounded-full py-2.5 hover:bg-primary/90 transition-colors"
          >
            <DownloadSimple className="h-4 w-4" />
            Install App
          </button>
        )}
      </div>
    </div>
  );
}
