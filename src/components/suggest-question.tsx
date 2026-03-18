"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABELS } from "@/lib/constants";
import { submitQuestionRequest } from "@/actions/question-requests";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lightbulb, Sparkle, ArrowRight, ArrowLeft, PaperPlaneTilt, CheckCircle } from "@phosphor-icons/react";

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label,
  emoji: { SPORTS: "🏅", CAMPUS: "🏛️", ACADEMICS: "📚", GREEK: "🎉", LAW_SCHOOL: "⚖️", OTHER: "❓" }[value] || "❓",
  gradient: {
    SPORTS: "from-blue-500 to-blue-600",
    CAMPUS: "from-purple-500 to-purple-600",
    ACADEMICS: "from-amber-500 to-amber-600",
    GREEK: "from-emerald-500 to-emerald-600",
    LAW_SCHOOL: "from-red-500 to-red-600",
    OTHER: "from-zinc-500 to-zinc-600",
  }[value] || "from-zinc-500 to-zinc-600",
}));

export function SuggestQuestion() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  function reset() {
    setStep(0);
    setTitle("");
    setDescription("");
    setCategory("OTHER");
    setSubmitted(false);
  }

  function close() {
    setOpen(false);
    setTimeout(reset, 200);
  }

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        await submitQuestionRequest(title, description, category);
        setSubmitted(true);
        toast.success("Market suggested! We'll review it soon.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to submit");
      }
    });
  };

  return (
    <>
      <Button variant="default" size="sm" onClick={() => setOpen(true)} className="gap-2">
        <Lightbulb className="h-4 w-4" />
        Suggest a New Market
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) close(); }}>
        <DialogContent showCloseButton={false} className="max-w-sm gap-0 p-0 overflow-hidden">
          <DialogTitle className="sr-only">Suggest a New Market</DialogTitle>

          {/* Success state */}
          {submitted ? (
            <div className="flex flex-col items-center text-center px-6 py-10 gap-4">
              <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold">Submitted!</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your market idea is in the queue. We&apos;ll review it and add it to the season if it&apos;s a good fit.
                </p>
              </div>
              <Button onClick={close} className="mt-2 rounded-full px-8">
                Done
              </Button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 px-5 pt-6 pb-5 text-white">
                <button
                  onClick={close}
                  className="absolute top-3 right-3 text-xs text-white/70 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-2.5 mb-1">
                  <Sparkle className="h-5 w-5" />
                  <h2 className="text-lg font-bold">Suggest a Market</h2>
                </div>
                <p className="text-sm text-white/80">
                  {step === 0
                    ? "What do you want people to predict?"
                    : step === 1
                      ? "Pick a category"
                      : "Review and submit"}
                </p>
                {/* Step indicators */}
                <div className="flex gap-1.5 mt-4">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`h-1 rounded-full transition-all ${
                        i === step ? "w-8 bg-white" : i < step ? "w-4 bg-white/60" : "w-4 bg-white/25"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Step 0: Question */}
              {step === 0 && (
                <div className="px-5 pt-5 pb-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium">Your question</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder='e.g. "Will W&L beat Roanoke in lacrosse?"'
                      maxLength={200}
                      autoFocus
                      className="w-full mt-1.5 rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">Must be a yes/no question. {title.length}/200</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Context <span className="text-muted-foreground font-normal">(optional)</span></label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Any extra details, resolution criteria, or why this would be fun..."
                      maxLength={500}
                      rows={3}
                      className="w-full mt-1.5 rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Step 1: Category */}
              {step === 1 && (
                <div className="px-5 pt-5 pb-4">
                  <div className="grid grid-cols-2 gap-2.5">
                    {CATEGORY_OPTIONS.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setCategory(cat.value)}
                        className={`relative flex items-center gap-2.5 rounded-xl border-2 px-3.5 py-3 text-left transition-all ${
                          category === cat.value
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-transparent bg-muted/50 hover:bg-muted"
                        }`}
                      >
                        <span className="text-xl">{cat.emoji}</span>
                        <span className="text-sm font-medium">{cat.label}</span>
                        {category === cat.value && (
                          <div className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Review */}
              {step === 2 && (
                <div className="px-5 pt-5 pb-4 space-y-3">
                  <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{CATEGORY_OPTIONS.find((c) => c.value === category)?.emoji}</span>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {CATEGORY_LABELS[category]}
                      </span>
                    </div>
                    <p className="font-semibold leading-snug">{title}</p>
                    {description && (
                      <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between border-t px-5 py-3">
                {step > 0 ? (
                  <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} className="gap-1.5">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {step < 2 ? (
                  <Button
                    size="sm"
                    onClick={() => setStep(step + 1)}
                    disabled={step === 0 && title.trim().length < 5}
                    className="gap-1.5"
                  >
                    Next
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="gap-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  >
                    <PaperPlaneTilt className="h-3.5 w-3.5" />
                    {isPending ? "Submitting..." : "Submit"}
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
