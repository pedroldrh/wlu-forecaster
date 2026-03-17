"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X, DownloadSimple } from "@phosphor-icons/react";
import { ForecasterLogo } from "@/components/forecaster-logo";
import { createClient } from "@/lib/supabase/client";
import { InstallInstructionsDialog } from "@/components/install-instructions-dialog";

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
  const [showInstallDialog, setShowInstallDialog] = useState(false);
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

  if ((!show && !showInstallDialog) || pathname === "/signin") return null;

  function handleDismiss() {
    localStorage.setItem("install-prompt-dismissed", String(Date.now()));
    setShow(false);
    setShowInstallDialog(false);
    setTimeout(() => setShow(true), 2 * 60 * 1000);
  }

  async function handleDirectInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShow(false);
  }

  function handleOpenInstallDialog() {
    setShowInstallDialog(true);
  }

  return (
    <>
      {show && (
        <div className="fixed bottom-20 md:bottom-4 inset-x-0 z-40 px-4 animate-fade-up">
          <div className="max-w-sm mx-auto bg-card border rounded-2xl shadow-lg p-4">
            <div className="flex items-start gap-3">
              <button
                type="button"
                className="shrink-0 h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center"
                onClick={handleOpenInstallDialog}
              >
                <ForecasterLogo className="h-6 w-6 text-white" />
              </button>

              <button
                type="button"
                className="flex-1 min-w-0 text-left"
                onClick={handleOpenInstallDialog}
              >
                <p className="text-sm font-semibold text-foreground">Get the Forecaster app</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tap here for install instructions
                </p>
              </button>

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
                onClick={handleDirectInstall}
                className="w-full mt-3 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold text-sm rounded-full py-2.5 hover:bg-primary/90 transition-colors"
              >
                <DownloadSimple className="h-4 w-4" />
                Install App
              </button>
            )}
          </div>
        </div>
      )}

      <InstallInstructionsDialog open={showInstallDialog} onOpenChange={setShowInstallDialog} />
    </>
  );
}
