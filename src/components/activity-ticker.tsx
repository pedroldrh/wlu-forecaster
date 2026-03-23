"use client";

import { useState, useEffect, useRef } from "react";

interface ActivityItem {
  displayName: string;
  questionTitle: string;
}

export function ActivityTicker({ items, paused }: { items: ActivityItem[]; paused: boolean }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (items.length === 0 || paused) {
      setVisible(false);
      return;
    }

    function showNext() {
      setVisible(true);

      // Hide after 3.5s
      timerRef.current = setTimeout(() => {
        setVisible(false);

        // Show next after 2s gap
        timerRef.current = setTimeout(() => {
          setCurrentIdx((prev) => (prev + 1) % items.length);
          showNext();
        }, 2000);
      }, 3500);
    }

    // Initial delay before first toast
    timerRef.current = setTimeout(showNext, 1500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [items, paused]);

  if (items.length === 0) return null;

  const item = items[currentIdx % items.length];
  if (!item) return null;

  // Truncate long question titles
  const maxTitleLen = 28;
  const title = item.questionTitle.length > maxTitleLen
    ? item.questionTitle.slice(0, maxTitleLen) + "..."
    : item.questionTitle;

  return (
    <div
      className={`fixed top-[calc(env(safe-area-inset-top,12px)+52px)] left-0 right-0 z-[4] flex justify-center pointer-events-none transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
      }`}
    >
      <div className="bg-white/[0.08] backdrop-blur-md rounded-full px-4 py-1.5 max-w-[85vw]">
        <p className="text-xs text-white/50 truncate">
          <span className="text-white/70 font-semibold">{item.displayName}</span>
          {" "}just voted on{" "}
          <span className="text-white/70">{title}</span>
        </p>
      </div>
    </div>
  );
}
