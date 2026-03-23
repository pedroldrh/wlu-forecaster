"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface ActivityItem {
  displayName: string;
  questionTitle: string;
}

interface Bubble {
  id: number;
  displayName: string;
  x: number; // percentage from left
  color: string;
  delay: number; // animation delay in ms
}

const COLORS = [
  "from-violet-500/30 to-fuchsia-500/20 border-violet-400/20",
  "from-cyan-500/30 to-blue-500/20 border-cyan-400/20",
  "from-amber-500/30 to-orange-500/20 border-amber-400/20",
  "from-emerald-500/30 to-teal-500/20 border-emerald-400/20",
  "from-rose-500/30 to-pink-500/20 border-rose-400/20",
  "from-sky-500/30 to-indigo-500/20 border-sky-400/20",
];

const TEXT_COLORS = [
  "text-violet-300",
  "text-cyan-300",
  "text-amber-300",
  "text-emerald-300",
  "text-rose-300",
  "text-sky-300",
];

let bubbleCounter = 0;

export function ActivityTicker({ items, paused }: { items: ActivityItem[]; paused: boolean }) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const idxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spawnBubble = useCallback(() => {
    if (items.length === 0) return;

    const item = items[idxRef.current % items.length];
    idxRef.current++;
    const colorIdx = bubbleCounter % COLORS.length;

    // Randomize horizontal position (15-85% to avoid edges)
    const x = 15 + Math.random() * 50;

    const bubble: Bubble = {
      id: bubbleCounter++,
      displayName: item.displayName,
      x,
      color: COLORS[colorIdx],
      delay: 0,
    };

    setBubbles((prev) => {
      // Keep max 3 visible at a time
      const kept = prev.slice(-2);
      return [...kept, bubble];
    });

    // Auto-remove after animation completes
    setTimeout(() => {
      setBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
    }, 4000);
  }, [items]);

  useEffect(() => {
    if (items.length === 0 || paused) return;

    // Spawn first bubble after short delay
    timerRef.current = setTimeout(() => {
      spawnBubble();
    }, 1200);

    // Then spawn every 1.8-2.5s (staggered)
    const interval = setInterval(() => {
      if (!paused) spawnBubble();
    }, 1800 + Math.random() * 700);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      clearInterval(interval);
    };
  }, [items, paused, spawnBubble]);

  if (items.length === 0) return null;

  return (
    <div className="fixed top-[calc(env(safe-area-inset-top,12px)+48px)] left-0 right-0 z-[4] pointer-events-none h-40">
      {bubbles.map((bubble) => {
        const colorIdx = bubble.id % TEXT_COLORS.length;
        return (
          <div
            key={bubble.id}
            className="absolute animate-[bubble-float_4s_ease-out_forwards]"
            style={{ left: `${bubble.x}%`, top: 0, transform: "translateX(-50%)" }}
          >
            <div
              className={`bg-gradient-to-br ${bubble.color} border backdrop-blur-xl rounded-2xl px-3.5 py-2 shadow-lg shadow-black/20`}
            >
              <p className="text-xs font-semibold whitespace-nowrap">
                <span className={TEXT_COLORS[colorIdx]}>{bubble.displayName}</span>
                <span className="text-white/40"> voted</span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
