"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { reviewDispute } from "@/actions/disputes";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

export function DisputeActions({ disputeId }: { disputeId: string }) {
  const [showReview, setShowReview] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAction = (status: "REVIEWED" | "DISMISSED") => {
    startTransition(async () => {
      try {
        await reviewDispute(disputeId, status, adminNote || undefined);
        toast.success(status === "REVIEWED" ? "Dispute acknowledged" : "Dispute dismissed");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to review");
      }
    });
  };

  if (showReview) {
    return (
      <div className="space-y-2 border-t pt-3">
        <div>
          <label className="text-xs text-muted-foreground">Admin note (optional)</label>
          <input
            type="text"
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="Response to the user..."
            className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => handleAction("REVIEWED")} disabled={isPending} className="gap-1">
            <Check className="h-3 w-3" /> Acknowledge
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleAction("DISMISSED")} disabled={isPending} className="gap-1">
            <X className="h-3 w-3" /> Dismiss
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowReview(false)}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 border-t pt-3">
      <Button size="sm" onClick={() => setShowReview(true)} className="gap-1">
        Review
      </Button>
    </div>
  );
}
