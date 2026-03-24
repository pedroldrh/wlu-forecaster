"use client";

import { useEffect, useState } from "react";

function isPWA() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

// Global signal — other components call splashReady() when they've loaded
let readyCount = 0;
const requiredCount = 1;
let resolveAllReady: (() => void) | null = null;
const allReadyPromise = new Promise<void>((resolve) => {
  resolveAllReady = resolve;
});

export function splashReady() {
  readyCount++;
  if (readyCount >= requiredCount && resolveAllReady) {
    resolveAllReady();
    resolveAllReady = null;
  }
}

export function SplashScreen() {
  const [state, setState] = useState<"visible" | "exiting" | "gone">("visible");

  useEffect(() => {
    if (!isPWA() || sessionStorage.getItem("splash-shown")) {
      setState("gone");
      return;
    }

    const minTime = new Promise<void>((r) => setTimeout(r, 800));
    const maxTime = new Promise<void>((r) => setTimeout(r, 2500));

    // Wait for both: minimum display time AND data ready (with max timeout)
    Promise.all([minTime, Promise.race([allReadyPromise, maxTime])]).then(() => {
      sessionStorage.setItem("splash-shown", "1");
      setState("exiting");
      // Remove from DOM after exit animation
      setTimeout(() => setState("gone"), 400);
    });
  }, []);

  if (state === "gone") return null;

  return (
    <div className={`splash-overlay ${state === "exiting" ? "splash-exiting" : ""}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="white"
        className="splash-logo"
      >
        <rect className="splash-bar splash-bar-1" x="3" y="13" width="4" height="8" rx="2" />
        <rect className="splash-bar splash-bar-2" x="10" y="3" width="4" height="18" rx="2" />
        <rect className="splash-bar splash-bar-3" x="17" y="8" width="4" height="13" rx="2" />
      </svg>
    </div>
  );
}
