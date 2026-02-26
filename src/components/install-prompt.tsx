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

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Don't show in PWA or on signin page
    if (isPWA()) return;

    // Check if user is signed in — only show to non-signed-in users
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) return;

      // Check if recently dismissed
      const dismissedAt = localStorage.getItem("install-prompt-dismissed");
      if (dismissedAt && Date.now() - Number(dismissedAt) < 2 * 60 * 1000) {
        // Set a timer to show again when 2 minutes have passed
        const remaining = 2 * 60 * 1000 - (Date.now() - Number(dismissedAt));
        const timer = setTimeout(() => setShow(true), remaining);
        return () => clearTimeout(timer);
      }

      // Show after a short delay so it doesn't flash immediately
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    });

    // Capture the beforeinstallprompt event (Chrome/Android)
    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  if (!show || pathname === "/signin") return null;

  function handleDismiss() {
    localStorage.setItem("install-prompt-dismissed", String(Date.now()));
    setShow(false);
    // Reappear after 2 minutes
    setTimeout(() => setShow(true), 2 * 60 * 1000);
  }

  async function handleInstall() {
    if (deferredPrompt) {
      // Chrome/Android — trigger native install prompt
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setShow(false);
    } else if (isIOS()) {
      // iOS — can't auto-install, just dismiss (the instructions are in the banner)
      handleDismiss();
    }
  }

  return (
    <div className="fixed bottom-20 md:bottom-4 inset-x-0 z-40 px-4 animate-fade-up">
      <div className="max-w-sm mx-auto bg-card border rounded-2xl shadow-lg p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="shrink-0 h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <ForecasterLogo className="h-6 w-6 text-white" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Get the Forecaster app</p>
            {isIOS() ? (
              <p className="text-xs text-muted-foreground mt-0.5">
                Tap <span className="inline-flex items-center"><svg className="h-3.5 w-3.5 inline text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M4 12h16M12 4v16M8 8l4-4 4 4" /></svg></span> then <strong className="text-foreground">&quot;Add to Home Screen&quot;</strong>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">
                Install for the best experience — faster, fullscreen, notifications.
              </p>
            )}
          </div>

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            className="shrink-0 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Install button (non-iOS) */}
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
