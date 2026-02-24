"use client";

import { Question } from "@phosphor-icons/react";

export function HowItWorksButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("open-onboarding"))}
      className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20 hover:border-primary/40 px-4 py-3 text-sm font-semibold text-primary hover:from-primary/15 hover:to-blue-500/15 active:scale-[0.98] transition-all"
    >
      <Question className="h-5 w-5" weight="bold" />
      How Forecaster Works
    </button>
  );
}
