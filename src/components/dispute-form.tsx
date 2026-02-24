"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { submitDispute } from "@/actions/disputes";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Warning, PaperPlaneTilt, CheckCircle } from "@phosphor-icons/react";

export function DisputeForm({ questionId }: { questionId: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  function reset() {
    setMessage("");
    setSubmitted(false);
  }

  function close() {
    setOpen(false);
    setTimeout(reset, 200);
  }

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        await submitDispute(questionId, message);
        setSubmitted(true);
        toast.success("Dispute submitted. We'll review it soon.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to submit");
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 w-full rounded-xl bg-red-500/10 border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/15 active:scale-[0.98] px-4 py-3 text-sm font-semibold text-red-500 transition-all"
      >
        <Warning className="h-5 w-5" weight="bold" />
        Dispute Resolution
      </button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) close(); }}>
        <DialogContent showCloseButton={false} className="max-w-sm gap-0 p-0 overflow-hidden">
          <DialogTitle className="sr-only">Dispute Resolution</DialogTitle>

          {submitted ? (
            <div className="flex flex-col items-center text-center px-6 py-10 gap-4">
              <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold">Dispute Submitted</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We&apos;ll review your dispute and get back to you. Thanks for keeping things fair.
                </p>
              </div>
              <Button onClick={close} className="mt-2 rounded-full px-8">
                Done
              </Button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="relative bg-gradient-to-r from-red-500 to-rose-600 px-5 pt-6 pb-5 text-white">
                <button
                  onClick={close}
                  className="absolute top-3 right-3 text-xs text-white/70 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-2.5 mb-1">
                  <Warning className="h-5 w-5" />
                  <h2 className="text-lg font-bold">Dispute Resolution</h2>
                </div>
                <p className="text-sm text-white/80">
                  Think this market was resolved incorrectly?
                </p>
              </div>

              {/* Form */}
              <div className="px-5 pt-5 pb-4 space-y-4">
                <div>
                  <label className="text-sm font-medium">Why do you think this is wrong?</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Explain your reasoning with evidence..."
                    maxLength={1000}
                    rows={4}
                    autoFocus
                    className="w-full mt-1.5 rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">{message.length}/1000</p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end border-t px-5 py-3">
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={isPending || message.trim().length < 10}
                  className="gap-1.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
                >
                  <PaperPlaneTilt className="h-3.5 w-3.5" />
                  {isPending ? "Submitting..." : "Submit Dispute"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
