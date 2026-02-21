"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BarChart3, Target, Trophy, ShieldCheck, Sparkles } from "lucide-react";

const STORAGE_KEY = "forecaster-onboarding-seen";

const steps = [
  {
    icon: Sparkles,
    iconColor: "text-primary",
    title: "Welcome to Forecaster!",
    description:
      "Predict campus events and win real money. Make forecasts, compete on the leaderboard, and earn prizes every two weeks.",
  },
  {
    icon: Target,
    iconColor: "text-primary",
    title: "Make Predictions",
    description:
      "Assign 0–100% probabilities to yes/no questions. The more confident and correct you are, the better you score.",
  },
  {
    icon: BarChart3,
    iconColor: "text-blue-500",
    title: "Brier Scoring",
    description:
      "Confident + correct = big points. Wrong + confident = lose points. The best forecasters are honest about what they don't know.",
  },
  {
    icon: ShieldCheck,
    iconColor: "text-amber-500",
    title: "Stay Active",
    description:
      "Forecast on 70%+ of questions to qualify for prizes. Even a 50% guess is better than skipping — consistency matters.",
  },
  {
    icon: Trophy,
    iconColor: "text-amber-500",
    title: "Win Prizes",
    description:
      "Prizes are paid out every 2 weeks to the top of the leaderboard. A new cycle means a fresh shot at winning.",
  },
];

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setOpen(true);
    });
  }, []);

  function complete() {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  }

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && complete()}>
      <DialogContent showCloseButton={false} className="max-w-sm gap-0 p-0">
        {/* Skip button */}
        <button
          onClick={complete}
          className="absolute top-3 right-3 z-10 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip
        </button>

        <DialogTitle className="sr-only">Onboarding</DialogTitle>

        <div className="flex flex-col items-center text-center px-6 pt-10 pb-6 gap-4">
          <div className="flex items-center justify-center h-14 w-14 rounded-full bg-muted">
            <Icon className={`h-7 w-7 ${current.iconColor}`} />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold">{current.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {current.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t px-6 py-4">
          {/* Dot indicators */}
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step
                    ? "w-4 bg-primary"
                    : "w-1.5 bg-muted-foreground/30"
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
  );
}
