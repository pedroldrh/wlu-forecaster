"use client";

import { Question } from "@phosphor-icons/react";

export function HowItWorksButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("open-onboarding"))}
      className="flex items-center justify-center gap-2 w-full rounded-md border border-muted-foreground/20 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
    >
      <Question className="h-4 w-4" />
      How Forecaster Works
    </button>
  );
}
