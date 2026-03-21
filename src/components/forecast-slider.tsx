"use client";

import { useState } from "react";
import { Check } from "@phosphor-icons/react";

interface VoteButtonsProps {
  currentVote: boolean | null;
  onSubmit: (vote: boolean) => Promise<void>;
  disabled?: boolean;
}

export function VoteButtons({ currentVote, onSubmit, disabled = false }: VoteButtonsProps) {
  const [submitting, setSubmitting] = useState<boolean | null>(null);

  const handleVote = async (vote: boolean) => {
    if (disabled || submitting !== null) return;
    setSubmitting(vote);
    try {
      await onSubmit(vote);
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="space-y-3">
      {currentVote !== null && (
        <p className="text-xs text-center text-muted-foreground">
          You voted {currentVote ? "YES" : "NO"} · tap to change
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleVote(true)}
          disabled={disabled || submitting !== null}
          className={`relative h-14 rounded-xl font-bold text-lg transition-all active:scale-[0.97] ${
            currentVote === true
              ? "bg-green-500 text-white shadow-lg shadow-green-500/25"
              : "bg-green-500/10 text-green-600 hover:bg-green-500/20 border border-green-500/20"
          } ${submitting === true ? "animate-pulse" : ""}`}
        >
          {currentVote === true && (
            <Check className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" weight="bold" />
          )}
          YES
        </button>
        <button
          onClick={() => handleVote(false)}
          disabled={disabled || submitting !== null}
          className={`relative h-14 rounded-xl font-bold text-lg transition-all active:scale-[0.97] ${
            currentVote === false
              ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
              : "bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20"
          } ${submitting === false ? "animate-pulse" : ""}`}
        >
          {currentVote === false && (
            <Check className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" weight="bold" />
          )}
          NO
        </button>
      </div>
    </div>
  );
}
