"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { submitDispute } from "@/actions/disputes";
import { toast } from "sonner";
import { AlertTriangle, X } from "lucide-react";

export function DisputeForm({ questionId }: { questionId: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await submitDispute(questionId, message);
        toast.success("Dispute submitted. We'll review it soon.");
        setMessage("");
        setOpen(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to submit");
      }
    });
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
        <AlertTriangle className="h-4 w-4" />
        Dispute Resolution
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Dispute Resolution
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Why do you think this resolution is wrong?</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explain your reasoning with evidence..."
              maxLength={1000}
              rows={4}
              required
              className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">{message.length}/1000</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={isPending || message.trim().length < 10}>
              {isPending ? "Submitting..." : "Submit Dispute"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
