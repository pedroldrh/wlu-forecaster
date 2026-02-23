"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
}

export function AnimatedNumber({
  value,
  duration = 1000,
  decimals = 1,
  suffix = "",
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(eased * value);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return (
    <span>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
