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
    if (!isPWA() || sessionStorage.getItem("splash-shown")) {
      document.body.style.background = "";
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => {
      sessionStorage.setItem("splash-shown", "1");
      document.body.style.background = "";
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
          <clipPath id="splash-clip">
            <rect x="3" y="13" width="4" height="8" rx="2" />
            <rect x="10" y="3" width="4" height="18" rx="2" />
            <rect x="17" y="8" width="4" height="13" rx="2" />
          </clipPath>
          <linearGradient id="splash-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="35%" stopColor="white" stopOpacity="0.5" />
            <stop offset="50%" stopColor="white" stopOpacity="1" />
            <stop offset="65%" stopColor="white" stopOpacity="0.5" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* White bars */}
        <g fill="white">
          <rect x="3" y="13" width="4" height="8" rx="2" />
          <rect x="10" y="3" width="4" height="18" rx="2" />
          <rect x="17" y="8" width="4" height="13" rx="2" />
        </g>
        {/* Diagonal shine clipped to bar shapes */}
        <g clipPath="url(#splash-clip)">
          <g transform="rotate(-25 12 12)">
            <rect x="-8" y="-8" width="8" height="42" fill="url(#splash-grad)">
              <animateTransform
                attributeName="transform"
                type="translate"
                from="0 0"
                to="36 0"
                dur="0.6s"
                begin="0.4s"
                fill="freeze"
              />
            </rect>
          </g>
        </g>
      </svg>
    </div>
  );
}
