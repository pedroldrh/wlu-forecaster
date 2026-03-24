"use client";

import { useState, useTransition, useEffect } from "react";
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

// Global event to open the suggest dialog from anywhere
export function openSuggestDialog() {
  window.dispatchEvent(new Event("open-suggest-question"));
}

export function SuggestQuestion({ showButton = true }: { showButton?: boolean } = {}) {
  const [open, setOpen] = useState(false);

  // Listen for external open triggers
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-suggest-question", handler);
    return () => window.removeEventListener("open-suggest-question", handler);
  }, []);
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
      {showButton && (
        <button
          onClick={() => setOpen(true)}
          className="group flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 hover:border-blue-500/40 hover:from-blue-500/15 hover:to-indigo-500/15 active:scale-[0.98] px-4 py-2.5 text-sm font-semibold text-blue-600 dark:text-blue-400 transition-all"
        >
          <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-blue-500/15 group-hover:bg-blue-500/25 transition-colors">
            <Lightbulb className="h-4 w-4" />
          </div>
          Suggest a Market
        </button>
      )}

      <Dialog open={open} onOpenChange={(v) => { if (!v) close(); }}>
        <DialogContent showCloseButton={false} className="max-w-[380px] gap-0 p-0 overflow-hidden rounded-2xl">
          <DialogTitle className="sr-only">Suggest a New Market</DialogTitle>

          {/* Success state */}
          {submitted ? (
            <div className="flex flex-col items-center text-center px-6 py-10 gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                <CheckCircle className="h-8 w-8 text-white" weight="bold" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold">Submitted!</h2>
                <p className="text-sm text-muted-foreground">
                  We&apos;ll review your idea and add it if it&apos;s a good fit.
                </p>
              </div>
              <Button onClick={close} className="mt-2 rounded-full px-8">
                Done
              </Button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 px-5 pt-5 pb-4 text-white">
                <button
                  onClick={close}
                  className="absolute top-3 right-3 h-7 w-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                >
                  <span className="text-xs font-medium">&times;</span>
                </button>
                <div className="flex items-center gap-2 mb-0.5">
                  <Sparkle className="h-5 w-5" weight="fill" />
                  <h2 className="text-base font-bold tracking-tight">Suggest a Market</h2>
                </div>
                <p className="text-[13px] text-white/75">
                  {step === 0
                    ? "What should people predict?"
                    : step === 1
                      ? "Pick a category"
                      : "Looks good?"}
                </p>
                <div className="flex gap-1.5 mt-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        i === step ? "w-10 bg-white" : i < step ? "w-6 bg-white/50" : "w-6 bg-white/20"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Step 0: Question */}
              {step === 0 && (
                <div className="px-5 pt-4 pb-3 space-y-3.5">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Question</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder='Will W&L beat Roanoke in lacrosse?'
                      maxLength={200}
                      autoFocus
                      className="w-full mt-1.5 rounded-xl border border-input bg-background px-3.5 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">Yes/no questions only &middot; {title.length}/200</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Context <span className="font-normal normal-case">(optional)</span></label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="How should this resolve? Any extra details..."
                      maxLength={500}
                      rows={2}
                      className="w-full mt-1.5 rounded-xl border border-input bg-background px-3.5 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Step 1: Category */}
              {step === 1 && (
                <div className="px-5 pt-4 pb-3">
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORY_OPTIONS.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setCategory(cat.value)}
                        className={`relative flex items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-all ${
                          category === cat.value
                            ? `bg-gradient-to-r ${cat.gradient} text-white shadow-md`
                            : "bg-muted/50 hover:bg-muted"
                        }`}
                      >
                        <span className="text-lg">{cat.emoji}</span>
                        <span className={`text-sm font-medium ${category === cat.value ? "text-white" : ""}`}>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Review */}
              {step === 2 && (
                <div className="px-5 pt-4 pb-3">
                  <div className={`rounded-xl bg-gradient-to-r ${CATEGORY_OPTIONS.find((c) => c.value === category)?.gradient} p-[1px]`}>
                    <div className="rounded-[11px] bg-background p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{CATEGORY_OPTIONS.find((c) => c.value === category)?.emoji}</span>
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          {CATEGORY_LABELS[category]}
                        </span>
                      </div>
                      <p className="font-semibold leading-snug">{title}</p>
                      {description && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-3 border-t">
                {step > 0 ? (
                  <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} className="gap-1.5 rounded-full">
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
                    className="gap-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 px-5"
                  >
                    Next
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="gap-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 px-5"
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
