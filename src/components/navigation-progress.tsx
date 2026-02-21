"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  // Start progress on link click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") || anchor.target === "_blank") return;

      // Only trigger for internal navigation that would change the page
      const url = new URL(href, window.location.origin);
      if (url.pathname + url.search === pathname + (searchParams?.toString() ? `?${searchParams}` : "")) return;

      cleanup();
      setProgress(0);
      setVisible(true);

      // Animate progress: fast at first, then slow down
      let p = 0;
      timerRef.current = setInterval(() => {
        p += (90 - p) * 0.1;
        setProgress(Math.min(p, 90));
      }, 100);
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname, searchParams, cleanup]);

  // Complete on route change
  useEffect(() => {
    if (!visible) return;
    cleanup();
    setProgress(100);
    timeoutRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 200);

    return cleanup;
  }, [pathname, searchParams]);

  if (!visible && progress === 0) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[49] h-[3px]">
      <div
        className="h-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.4)]"
        style={{
          width: `${progress}%`,
          transition: progress === 100 ? "width 150ms ease-out, opacity 150ms ease-out 100ms" : "width 200ms ease-out",
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
