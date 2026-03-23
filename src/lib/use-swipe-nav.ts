"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const SWIPE_THRESHOLD = 80;

interface SwipeNavOptions {
  /** URL to navigate to when swiping right */
  rightHref?: string | null;
  /** URL to navigate to when swiping left */
  leftHref?: string | null;
  /** Label shown when swiping right */
  rightLabel?: string;
  /** Label shown when swiping left */
  leftLabel?: string;
  /** Called before navigating away */
  onNavigate?: () => void;
}

export function useSwipeNav(options: SwipeNavOptions) {
  const { rightHref, leftHref, rightLabel, leftLabel, onNavigate } = options;
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const touchRef = useRef({ startX: 0, startY: 0, locked: null as "h" | "v" | null, currentX: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const onTouchStart = (e: TouchEvent) => {
      if (navigating) return;
      const t = e.touches[0];
      touchRef.current = { startX: t.clientX, startY: t.clientY, locked: null, currentX: 0 };
      setSwiping(true);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (navigating) return;
      const t = e.touches[0];
      const dx = t.clientX - touchRef.current.startX;
      const dy = t.clientY - touchRef.current.startY;

      if (!touchRef.current.locked) {
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
          touchRef.current.locked = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
        }
        return;
      }

      if (touchRef.current.locked === "v") return;

      // Only allow swipe in directions that have a target
      if (dx > 0 && !rightHref) return;
      if (dx < 0 && !leftHref) return;

      e.preventDefault();
      const dampened = dx * 0.5;
      touchRef.current.currentX = dampened;
      setSwipeX(dampened);
    };

    const onTouchEnd = () => {
      if (navigating) return;
      setSwiping(false);
      if (touchRef.current.locked !== "h") {
        setSwipeX(0);
        return;
      }

      const dx = touchRef.current.currentX;
      if (Math.abs(dx) > SWIPE_THRESHOLD) {
        const direction = dx > 0 ? 1 : -1;
        const href = direction > 0 ? rightHref : leftHref;
        if (href) {
          setSwipeX(direction * window.innerWidth);
          setNavigating(true);
          onNavigate?.();
          setTimeout(() => router.push(href), 250);
        } else {
          setSwipeX(0);
        }
      } else {
        setSwipeX(0);
      }
    };

    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchmove", onTouchMove, { passive: false });
    root.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchmove", onTouchMove);
      root.removeEventListener("touchend", onTouchEnd);
    };
  }, [navigating, router, rightHref, leftHref, onNavigate]);

  const swipeStyle = {
    transform: `translateX(${swipeX}px)`,
    transition: swiping ? "none" : "transform 250ms cubic-bezier(0.2, 0, 0, 1)",
  };

  const peekDirection = swipeX > 20 ? "right" : swipeX < -20 ? "left" : null;
  const peekLabel = peekDirection === "right" ? (rightLabel ?? null) : peekDirection === "left" ? (leftLabel ?? null) : null;

  const reset = useCallback(() => {
    setSwipeX(0);
    setNavigating(false);
    setSwiping(false);
  }, []);

  return { containerRef, swipeStyle, peekLabel, peekDirection, reset };
}
