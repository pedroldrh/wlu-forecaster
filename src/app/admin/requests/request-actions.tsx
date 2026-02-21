"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { approveQuestionRequest, denyQuestionRequest } from "@/actions/question-requests";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

interface RequestActionsProps {
  requestId: string;
  seasonId: string | null;
  seasonName: string | null;
}

export function RequestActions({ requestId, seasonId, seasonName }: RequestActionsProps) {
  const [showApprove, setShowApprove] = useState(false);
  const [showDeny, setShowDeny] = useState(false);
  const [closeTime, setCloseTime] = useState("");
  const [resolveTime, setResolveTime] = useState("");
  const [denyNote, setDenyNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    if (!seasonId) { toast.error("No live season"); return; }
    if (!closeTime || !resolveTime) { toast.error("Set both dates"); return; }

    startTransition(async () => {
      try {
        await approveQuestionRequest(requestId, seasonId, new Date(closeTime).toISOString(), new Date(resolveTime).toISOString());
        toast.success("Question approved and created!");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to approve");
      }
    });
  };

  const handleDeny = () => {
    startTransition(async () => {
      try {
        await denyQuestionRequest(requestId, denyNote);
        toast.success("Request denied");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to deny");
      }
    });
  };

  if (showApprove) {
    return (
      <div className="space-y-2 border-t pt-3">
        <p className="text-sm font-medium">Approve → Create question in {seasonName || "live season"}</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Close time</label>
            <input
              type="datetime-local"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Resolve time</label>
            <input
              type="datetime-local"
              value={resolveTime}
              onChange={(e) => setResolveTime(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleApprove} disabled={isPending}>
            {isPending ? "Creating..." : "Confirm & Create"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowApprove(false)}>Cancel</Button>
        </div>
      </div>
    );
  }

  if (showDeny) {
    return (
      <div className="space-y-2 border-t pt-3">
        <div>
          <label className="text-xs text-muted-foreground">Reason (optional)</label>
          <input
            type="text"
            value={denyNote}
            onChange={(e) => setDenyNote(e.target.value)}
            placeholder="Too vague, already asked, etc."
            className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="destructive" onClick={handleDeny} disabled={isPending}>
            {isPending ? "Denying..." : "Confirm Deny"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowDeny(false)}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 border-t pt-3">
      <Button size="sm" onClick={() => setShowApprove(true)} className="gap-1">
        <Check className="h-3 w-3" /> Approve
      </Button>
      <Button size="sm" variant="outline" onClick={() => setShowDeny(true)} className="gap-1">
        <X className="h-3 w-3" /> Deny
      </Button>
    </div>
  );
}
