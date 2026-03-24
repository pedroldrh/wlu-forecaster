"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { CATEGORY_LABELS } from "@/lib/constants";
import { submitQuestionRequest } from "@/actions/question-requests";
import { toast } from "sonner";
import { X, PaperPlaneTilt, CheckCircle, Lightbulb } from "@phosphor-icons/react";
import { createPortal } from "react-dom";
import { getCachedUserType } from "@/components/user-type-gate";

const CATEGORIES = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));

export function openSuggestDialog() {
  window.dispatchEvent(new Event("open-suggest-question"));
}

export function SuggestQuestion({ showButton = true }: { showButton?: boolean }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("CAMPUS");
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-suggest-question", handler);
    return () => window.removeEventListener("open-suggest-question", handler);
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (open && !submitted) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, submitted]);

  function reset() {
    setTitle("");
    setDescription("");
    setCategory("CAMPUS");
    setSubmitted(false);
  }

  function close() {
    setOpen(false);
    setTimeout(reset, 300);
  }

  const handleSubmit = () => {
    if (title.trim().length < 5) return;
    startTransition(async () => {
      try {
        await submitQuestionRequest(title.trim(), description.trim(), category);
        setSubmitted(true);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to submit");
      }
    });
  };

  // Filter out LAW_SCHOOL for undergrads
  const userType = getCachedUserType();
  const visibleCategories = CATEGORIES.filter((c) => {
    if (userType === "UNDERGRAD" && c.value === "LAW_SCHOOL") return false;
    if (userType === "LAW" && c.value !== "LAW_SCHOOL") return false;
    return true;
  });

  if (!open) {
    if (!showButton) return null;
    return (
      <button
        onClick={() => setOpen(true)}
        className="group flex items-center gap-2.5 rounded-xl bg-white/5 border border-white/10 active:scale-[0.98] px-4 py-2.5 text-sm font-semibold text-white/70 transition-all"
      >
        <Lightbulb className="h-4 w-4 text-amber-400" weight="fill" />
        Suggest a Question
      </button>
    );
  }

  const modal = (
    <div
      className="fixed inset-0 z-[200] bg-black/95 flex flex-col"
      style={{ animation: "fade-up 250ms ease-out" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top,16px),16px)] pb-3">
        <button
          onClick={close}
          className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center active:scale-[0.85] transition-all"
        >
          <X className="h-5 w-5 text-white/60" />
        </button>
        <h2 className="text-base font-bold text-white">Suggest a Question</h2>
        <div className="w-9" />
      </div>

      {submitted ? (
        /* ── Success ── */
        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-5">
          <div className="h-20 w-20 rounded-full bg-green-500/15 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-400" weight="fill" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-white">Submitted!</h3>
            <p className="text-sm text-white/40">We'll review your question and add it if it's a good fit.</p>
          </div>
          <button
            onClick={close}
            className="mt-4 rounded-full bg-white px-8 py-3 text-sm font-bold text-black active:scale-[0.95] transition-all"
          >
            Done
          </button>
        </div>
      ) : (
        /* ── Form ── */
        <div className="flex-1 flex flex-col px-5 pt-4">
          {/* Question input */}
          <div className="space-y-2 mb-5">
            <label className="text-xs font-bold text-white/30 uppercase tracking-widest">Your question</label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Will W&L beat Roanoke in lacrosse?"
              maxLength={200}
              className="w-full bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-4 text-white text-base placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-colors"
            />
            <p className="text-[11px] text-white/20 pl-1">Yes or no questions only</p>
          </div>

          {/* Context */}
          <div className="space-y-2 mb-6">
            <label className="text-xs font-bold text-white/30 uppercase tracking-widest">
              Context <span className="font-normal normal-case text-white/15">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="How should this be resolved? Any extra details..."
              maxLength={500}
              rows={2}
              className="w-full bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-colors resize-none"
            />
          </div>

          {/* Category pills */}
          {visibleCategories.length > 1 && (
            <div className="space-y-2 mb-8">
              <label className="text-xs font-bold text-white/30 uppercase tracking-widest">Category</label>
              <div className="flex flex-wrap gap-2">
                {visibleCategories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-all active:scale-[0.93] ${
                      category === cat.value
                        ? "bg-white text-black"
                        : "bg-white/[0.06] text-white/40 border border-white/10"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Submit */}
          <div className="pb-[max(env(safe-area-inset-bottom,24px),24px)]">
            <button
              onClick={handleSubmit}
              disabled={isPending || title.trim().length < 5}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white py-4 text-base font-bold text-black active:scale-[0.97] transition-all disabled:opacity-30 disabled:active:scale-100"
            >
              <PaperPlaneTilt className="h-5 w-5" weight="fill" />
              {isPending ? "Submitting..." : "Submit Question"}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modal, document.body);
}
