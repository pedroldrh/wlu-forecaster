"use client";

import { useEffect, useState } from "react";

function isPWA() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Remove the inline pre-splash blocker
    document.getElementById("splash-pre")?.remove();
    document.body.style.background = "";

    if (!isPWA() || sessionStorage.getItem("splash-shown")) {
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => {
      sessionStorage.setItem("splash-shown", "1");
      setVisible(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="splash-overlay">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="splash-logo"
      >
        <defs>
          <clipPath id="splash-bars-clip">
            <rect x="3" y="13" width="4" height="8" rx="2" />
            <rect x="10" y="3" width="4" height="18" rx="2" />
            <rect x="17" y="8" width="4" height="13" rx="2" />
          </clipPath>
          <linearGradient id="splash-shine-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="35%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.9)" />
            <stop offset="65%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        {/* White bars */}
        <g fill="white">
          <rect x="3" y="13" width="4" height="8" rx="2" />
          <rect x="10" y="3" width="4" height="18" rx="2" />
          <rect x="17" y="8" width="4" height="13" rx="2" />
        </g>
        {/* Diagonal reflection clipped to bar shapes */}
        <g clipPath="url(#splash-bars-clip)">
          <rect
            className="splash-reflection"
            x="0"
            y="-6"
            width="6"
            height="36"
            fill="url(#splash-shine-grad)"
          />
        </g>
      </svg>
    </div>
  );
}
