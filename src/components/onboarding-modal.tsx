"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

const STORAGE_KEY = "forecaster-onboarding-seen";

const slides = [
  {
    image: "/onboarding/prize-pool.jpg",
    title: "Compete for Real Prizes",
    description:
      "Every season has a prize pool. Join for free and compete against other W&L students for cash prizes.",
  },
  {
    image: "/onboarding/markets.jpg",
    title: "Vote on Campus Markets",
    description:
      "Browse markets about sports, campus events, academics, and more. Tap \"Vote\" to make your prediction.",
  },
  {
    image: "/onboarding/market-detail.jpg",
    title: "Set Your Probability",
    description:
      "Assign a 0-100% chance to each question. The more confident and correct you are, the higher you score.",
  },
  {
    image: "/onboarding/leaderboard.jpg",
    title: "Climb the Leaderboard",
    description:
      "Forecast on at least 5 markets to qualify for prizes. Top forecasters win cash every season.",
  },
];

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [hasSeen, setHasSeen] = useState(true);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen) {
      setHasSeen(true);
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setHasSeen(false);
        setOpen(true);
      }
    });
  }, []);

  const complete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setHasSeen(true);
    setOpen(false);
    setStep(0);
  }, []);

  const openGuide = useCallback(() => {
    setStep(0);
    setOpen(true);
  }, []);

  const current = slides[step];
  const isLast = step === slides.length - 1;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) complete(); }}>
        <DialogContent showCloseButton={false} className="max-w-sm gap-0 p-0 overflow-hidden">
          <button
            onClick={complete}
            className="absolute top-3 right-3 z-10 text-xs text-muted-foreground hover:text-foreground transition-colors bg-background/80 backdrop-blur rounded-full px-2 py-1"
          >
            Skip
          </button>

          <DialogTitle className="sr-only">How Forecaster Works</DialogTitle>

          <div className="relative w-full aspect-[9/16] max-h-[50vh] overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.image}
              alt={current.title}
              className="w-full h-full object-cover object-top"
            />
          </div>

          <div className="px-5 pt-4 pb-3 text-center space-y-1.5">
            <h2 className="text-lg font-bold">{current.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {current.description}
            </p>
          </div>

          <div className="flex items-center justify-between border-t px-5 py-3">
            <div className="flex gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step
                      ? "w-4 bg-primary"
                      : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                />
              ))}
            </div>

            <Button size="sm" onClick={isLast ? complete : () => setStep(step + 1)}>
              {isLast ? "Get Started" : "Next"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating "How it works" button — shown after onboarding is dismissed */}
      {hasSeen && !open && (
        <button
          onClick={openGuide}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground shadow-lg px-3 py-2 text-xs font-medium hover:bg-primary/90 active:scale-95 transition-all"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          How it works
        </button>
      )}
    </>
  );
}
