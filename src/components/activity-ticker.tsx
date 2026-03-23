"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { User } from "@phosphor-icons/react";

interface ActivityItem {
  displayName: string;
  questionTitle: string;
}

interface Bubble {
  id: number;
  x: number; // percentage from left (20-80)
  y: number; // percentage from top (25-55)
}

let bubbleCounter = 0;

export function ActivityTicker({ items, paused }: { items: ActivityItem[]; paused: boolean }) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spawnBubble = useCallback(() => {
    if (items.length === 0) return;

    const bubble: Bubble = {
      id: bubbleCounter++,
      x: 20 + Math.random() * 60,
      y: 25 + Math.random() * 30,
    };

    setBubbles((prev) => {
      const kept = prev.slice(-2);
      return [...kept, bubble];
    });

    setTimeout(() => {
      setBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
    }, 3500);
  }, [items]);

  useEffect(() => {
    if (items.length === 0 || paused) return;

    timerRef.current = setTimeout(spawnBubble, 1500);

    const interval = setInterval(() => {
      if (!paused) spawnBubble();
    }, 2200 + Math.random() * 800);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      clearInterval(interval);
    };
  }, [items, paused, spawnBubble]);

  if (items.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[2] pointer-events-none">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="absolute animate-[voted-pop_3.5s_ease-out_forwards]"
          style={{
            left: `${bubble.x}%`,
            top: `${bubble.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="flex flex-col items-center gap-1">
            <div className="h-10 w-10 rounded-full bg-white/[0.08] backdrop-blur-sm flex items-center justify-center">
              <User className="h-5 w-5 text-white/50" weight="fill" />
            </div>
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
              Voted!
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
