"use client";

import { Trophy, MonitorPlay, User } from "@phosphor-icons/react";

const ICONS: Record<string, typeof Trophy> = {
  Leaderboard: Trophy,
  Feed: MonitorPlay,
  Profile: User,
};

export function SwipePeek({ label }: { label: string | null }) {
  if (!label) return null;

  const Icon = ICONS[label] ?? MonitorPlay;

  return (
    <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none">
      <div className="flex flex-col items-center gap-3 text-white/60">
        <Icon className="h-10 w-10" weight="bold" />
        <span className="text-lg font-bold uppercase tracking-widest">{label}</span>
      </div>
    </div>
  );
}
