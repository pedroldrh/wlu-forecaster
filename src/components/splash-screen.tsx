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
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => {
      sessionStorage.setItem("splash-shown", "1");
      setVisible(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="splash-overlay">
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
