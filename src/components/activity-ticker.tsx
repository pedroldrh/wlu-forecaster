"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface ActivityItem {
  userId: string;
  displayName: string;
  questionTitle: string;
}

interface Bubble {
  id: number;
  userId: string;
  x: number;
  y: number;
}

let bubbleCounter = 0;

export function ActivityTicker({ items, paused }: { items: ActivityItem[]; paused: boolean }) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const idxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spawnBubble = useCallback(() => {
    if (items.length === 0) return;

    const item = items[idxRef.current % items.length];
    idxRef.current++;

    const bubble: Bubble = {
      id: bubbleCounter++,
      userId: item.userId,
      x: 15 + Math.random() * 70,
      y: 28 + Math.random() * 25,
    };

    setBubbles((prev) => prev.slice(-2).concat(bubble));

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
          <div className="flex flex-col items-center gap-1.5">
            <img
              src={`/api/avatar/${bubble.userId}`}
              alt=""
              className="h-12 w-12 rounded-full ring-2 ring-white/20 shadow-lg shadow-black/40"
            />
            <span className="text-[11px] font-bold text-white/30 bg-black/20 backdrop-blur-sm rounded-full px-2.5 py-0.5">
              Voted!
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
