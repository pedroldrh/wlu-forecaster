"use client";

import { useEffect, useState } from "react";

export function SplashScreen() {
  // Start true so overlay renders immediately on first paint (no flash)
  const [visible, setVisible] = useState(true);

  useEffect(() => {
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
      <div className="splash-logo-wrap">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="white"
          className="splash-logo"
        >
          <rect x="3" y="13" width="4" height="8" rx="2" />
          <rect x="10" y="3" width="4" height="18" rx="2" />
          <rect x="17" y="8" width="4" height="13" rx="2" />
        </svg>
        {/* Reflection shine that sweeps across */}
        <div className="splash-reflection" />
      </div>
    </div>
  );
}
