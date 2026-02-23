"use client";

import { useEffect, useState } from "react";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Remove the inline pre-splash blocker
    document.getElementById("splash-pre")?.remove();
    // Reset body background to normal
    document.body.style.background = "";

    if (sessionStorage.getItem("splash-shown")) {
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
          {/* Clip path shaped like the 3 bars */}
          <clipPath id="splash-bars-clip">
            <rect x="3" y="13" width="4" height="8" rx="2" />
            <rect x="10" y="3" width="4" height="18" rx="2" />
            <rect x="17" y="8" width="4" height="13" rx="2" />
          </clipPath>
        </defs>
        {/* White bars */}
        <g fill="white">
          <rect x="3" y="13" width="4" height="8" rx="2" />
          <rect x="10" y="3" width="4" height="18" rx="2" />
          <rect x="17" y="8" width="4" height="13" rx="2" />
        </g>
        {/* Reflection clipped to bar shapes only */}
        <g clipPath="url(#splash-bars-clip)">
          <rect
            className="splash-reflection"
            x="-6"
            y="0"
            width="8"
            height="24"
            fill="url(#splash-shine-grad)"
            transform="skewX(-15)"
          />
          <defs>
            <linearGradient id="splash-shine-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="40%" stopColor="rgba(255,255,255,0.5)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.9)" />
              <stop offset="60%" stopColor="rgba(255,255,255,0.5)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
        </g>
      </svg>
    </div>
  );
}
