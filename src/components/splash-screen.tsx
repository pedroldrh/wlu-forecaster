"use client";

import { useEffect, useState } from "react";

export function SplashScreen() {
  const [visible, setVisible] = useState<boolean | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem("splash-shown")) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const timer = setTimeout(() => {
      sessionStorage.setItem("splash-shown", "1");
      setVisible(false);
    }, 2300);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="splash-overlay">
      {/* Logo bars */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="white"
        className="splash-logo"
      >
        <rect
          className="splash-bar splash-bar-1"
          x="3"
          y="13"
          width="4"
          height="8"
          rx="2"
        />
        <rect
          className="splash-bar splash-bar-2"
          x="10"
          y="3"
          width="4"
          height="18"
          rx="2"
        />
        <rect
          className="splash-bar splash-bar-3"
          x="17"
          y="8"
          width="4"
          height="13"
          rx="2"
        />
      </svg>

      {/* Shockwave ring */}
      <div className="splash-shockwave" />

      {/* Text */}
      <p className="splash-text">FORECASTER</p>
    </div>
  );
}
