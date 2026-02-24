"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Question } from "@phosphor-icons/react";

const SEEN_KEY = "forecaster-onboarding-seen";
const COMPLETED_KEY = "forecaster-onboarding-completed";

const slides = [
  {
    image: "/onboarding/home.png",
    title: "Compete for Real Prizes",
    description:
      "Every season has a prize pool. Join for free and compete against other W&L students for cash prizes.",
  },
  {
    image: "/onboarding/markets.png",
    title: "Vote on Campus Markets",
    description:
      "Browse markets about sports, campus events, academics, and more. Tap \"Vote\" to make your prediction.",
  },
  {
    image: "/onboarding/market-detail.png",
    title: "Set Your Probability",
    description:
      "Assign a 0-100% chance to each question. The more confident and correct you are, the higher you score.",
  },
  {
    image: "/onboarding/leaderboard.png",
    title: "Climb the Leaderboard",
    description:
      "Forecast on at least 5 markets to qualify for prizes. Top forecasters win cash every season.",
  },
  {
    image: "/onboarding/profile.png",
    title: "Track Your Progress",
    description:
      "View your score, forecasts, and stats on your profile. Share your referral link to earn bonus points.",
  },
];

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [showFab, setShowFab] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(SEEN_KEY);
    const completed = localStorage.getItem(COMPLETED_KEY);

    if (seen && !completed) {
      // Dismissed without completing — show the floating button
      setShowFab(true);
      return;
    }
    if (completed) {
      // Completed the walkthrough — hide everything
      return;
    }

    // First time — check if logged in
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setOpen(true);
      }
    });
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(SEEN_KEY, "true");
    setOpen(false);
    setStep(0);
    // Only show fab if they didn't finish all slides
    if (!localStorage.getItem(COMPLETED_KEY)) {
      setShowFab(true);
    }
    window.dispatchEvent(new Event("onboarding-closed"));
  }, []);

  const complete = useCallback(() => {
    localStorage.setItem(SEEN_KEY, "true");
    localStorage.setItem(COMPLETED_KEY, "true");
    setOpen(false);
    setStep(0);
    setShowFab(false);
    window.dispatchEvent(new Event("onboarding-closed"));
  }, []);

  const openGuide = useCallback(() => {
    setStep(0);
    setShowFab(false);
    setOpen(true);
  }, []);

  const current = slides[step];
  const isLast = step === slides.length - 1;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
        <DialogContent showCloseButton={false} className="max-w-sm gap-0 p-0 overflow-hidden">
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 z-10 text-xs text-muted-foreground hover:text-foreground transition-colors bg-background/80 backdrop-blur rounded-full px-2 py-1"
          >
            Skip
          </button>

          <DialogTitle className="sr-only">How Forecaster Works</DialogTitle>

          <div className="w-full bg-muted flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.image}
              alt={current.title}
              className="w-full h-auto max-h-[55vh] object-contain"
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

      {/* Floating "How it works" — only if user dismissed without completing */}
      {showFab && !open && (
        <button
          onClick={openGuide}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground shadow-lg px-3 py-2 text-xs font-medium hover:bg-primary/90 active:scale-95 transition-all"
        >
          <Question className="h-3.5 w-3.5" />
          How it works
        </button>
      )}
    </>
  );
}
