"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Share, Download } from "lucide-react";

const STORAGE_KEY = "forecaster-install-dismissed";

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

function isAndroid() {
  if (typeof navigator === "undefined") return false;
  return /Android/.test(navigator.userAgent);
}

function isMobile() {
  return isIOS() || isAndroid();
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches
    || ("standalone" in navigator && (navigator as any).standalone === true);
}

export function InstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (!isMobile()) return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    // Small delay so page loads first
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 pb-[env(safe-area-inset-bottom,16px)]">
      <div className="max-w-md mx-auto rounded-xl border bg-background shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Install Forecaster</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isIOS()
                ? <>Tap <Share className="inline h-3.5 w-3.5 -mt-0.5" /> <strong>Share</strong> then <strong>&quot;Add to Home Screen&quot;</strong> to install as an app.</>
                : <>Tap the <strong>menu (⋮)</strong> then <strong>&quot;Add to Home Screen&quot;</strong> or <strong>&quot;Install App&quot;</strong>.</>
              }
            </p>
          </div>
          <button onClick={dismiss} className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

const STORAGE_KEY_FAB_DISMISSED = "forecaster-install-fab-dismissed";

export function InstallFab() {
  const [show, setShow] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (isStandalone() || !isMobile()) return;
    if (!localStorage.getItem(STORAGE_KEY)) return;
    if (localStorage.getItem(STORAGE_KEY_FAB_DISMISSED)) return;
    setShow(true);
  }, []);

  function dismissFab() {
    localStorage.setItem(STORAGE_KEY_FAB_DISMISSED, "true");
    setShow(false);
  }

  if (!show) return null;

  return (
    <>
      <div className="fixed bottom-20 right-4 z-40 flex items-center gap-2 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="flex items-center rounded-full bg-primary shadow-lg pl-3 pr-1 py-1.5 gap-2">
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 text-primary-foreground text-xs font-medium"
          >
            <Download className="h-3.5 w-3.5" />
            Install App
          </button>
          <button
            onClick={dismissFab}
            className="text-primary-foreground/70 hover:text-primary-foreground p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 pb-[env(safe-area-inset-bottom,16px)]" onClick={() => setModalOpen(false)}>
          <div className="max-w-md w-full rounded-xl border bg-background shadow-lg p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <p className="font-semibold">Install Forecaster as an App</p>
              <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              {isIOS() ? (
                <ol className="list-decimal list-inside space-y-2">
                  <li>Tap the <Share className="inline h-4 w-4 -mt-0.5" /> <strong className="text-foreground">Share</strong> button in Safari</li>
                  <li>Scroll down and tap <strong className="text-foreground">&quot;Add to Home Screen&quot;</strong></li>
                  <li>Tap <strong className="text-foreground">&quot;Add&quot;</strong> to confirm</li>
                </ol>
              ) : (
                <ol className="list-decimal list-inside space-y-2">
                  <li>Tap the <strong className="text-foreground">menu (&#8942;)</strong> in your browser</li>
                  <li>Tap <strong className="text-foreground">&quot;Add to Home Screen&quot;</strong> or <strong className="text-foreground">&quot;Install App&quot;</strong></li>
                  <li>Tap <strong className="text-foreground">&quot;Install&quot;</strong> to confirm</li>
                </ol>
              )}
            </div>
            <Button className="w-full mt-4" onClick={() => setModalOpen(false)}>
              Got it
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

export function InstallIconButton() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (isStandalone()) return;
    setHidden(false);
  }, []);

  if (hidden) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center h-10 w-10 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors md:hidden"
      >
        <Download className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="max-w-md w-full rounded-xl border bg-background shadow-lg p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <p className="font-semibold">Install Forecaster as an App</p>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              {isIOS() ? (
                <ol className="list-decimal list-inside space-y-2">
                  <li>Tap the <Share className="inline h-4 w-4 -mt-0.5" /> <strong className="text-foreground">Share</strong> button in Safari</li>
                  <li>Scroll down and tap <strong className="text-foreground">&quot;Add to Home Screen&quot;</strong></li>
                  <li>Tap <strong className="text-foreground">&quot;Add&quot;</strong> to confirm</li>
                </ol>
              ) : (
                <ol className="list-decimal list-inside space-y-2">
                  <li>Tap the <strong className="text-foreground">menu (&#8942;)</strong> in your browser</li>
                  <li>Tap <strong className="text-foreground">&quot;Add to Home Screen&quot;</strong> or <strong className="text-foreground">&quot;Install App&quot;</strong></li>
                  <li>Tap <strong className="text-foreground">&quot;Install&quot;</strong> to confirm</li>
                </ol>
              )}
            </div>
            <Button className="w-full mt-4" onClick={() => setOpen(false)}>
              Got it
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

export function InstallAppLink() {
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Only show the link if on mobile, not standalone, and user dismissed the prompt
    if (isStandalone() || !isMobile()) return;
    if (!localStorage.getItem(STORAGE_KEY)) return;
    setShow(true);
  }, []);

  if (!show) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground"
        onClick={() => setOpen(!open)}
      >
        <Download className="h-3.5 w-3.5" />
        Install App
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 pb-[env(safe-area-inset-bottom,16px)]" onClick={() => setOpen(false)}>
          <div className="max-w-md w-full rounded-xl border bg-background shadow-lg p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <p className="font-semibold">Install Forecaster as an App</p>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              {isIOS() ? (
                <ol className="list-decimal list-inside space-y-2">
                  <li>Tap the <Share className="inline h-4 w-4 -mt-0.5" /> <strong className="text-foreground">Share</strong> button in Safari</li>
                  <li>Scroll down and tap <strong className="text-foreground">&quot;Add to Home Screen&quot;</strong></li>
                  <li>Tap <strong className="text-foreground">&quot;Add&quot;</strong> to confirm</li>
                </ol>
              ) : (
                <ol className="list-decimal list-inside space-y-2">
                  <li>Tap the <strong className="text-foreground">menu (⋮)</strong> in your browser</li>
                  <li>Tap <strong className="text-foreground">&quot;Add to Home Screen&quot;</strong> or <strong className="text-foreground">&quot;Install App&quot;</strong></li>
                  <li>Tap <strong className="text-foreground">&quot;Install&quot;</strong> to confirm</li>
                </ol>
              )}
            </div>
            <Button className="w-full mt-4" onClick={() => setOpen(false)}>
              Got it
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
