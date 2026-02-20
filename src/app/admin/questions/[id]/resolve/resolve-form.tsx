"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { resolveQuestion } from "@/actions/questions";
import { toast } from "sonner";
import { CheckCircle, XCircle, Users } from "lucide-react";

interface Question {
  id: string;
  title: string;
  description: string;
  category: string;
}

export function ResolveForm({ question, forecastCount }: { question: Question; forecastCount: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [outcome, setOutcome] = useState<boolean | null>(null);

  async function handleResolve() {
    if (outcome === null) return;
    setLoading(true);
    try {
      await resolveQuestion(question.id, outcome);
      toast.success(`Question resolved as ${outcome ? "YES" : "NO"}`);
      router.push("/admin/questions");
    } catch (error) {
      toast.error("Failed to resolve question");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Resolve Question</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium">{question.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{question.description}</p>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {forecastCount} forecast{forecastCount !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-20" onClick={() => setOutcome(true)}>
                  <div className="text-center">
                    <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
                    <span>Resolve YES</span>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Resolution</DialogTitle>
                  <DialogDescription>
                    Resolve "{question.title}" as <strong>YES</strong>? This cannot be undone. {forecastCount} forecast{forecastCount !== 1 ? "s" : ""} will be scored.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOutcome(null)}>Cancel</Button>
                  <Button onClick={handleResolve} disabled={loading}>
                    {loading ? "Resolving..." : "Confirm YES"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-20" onClick={() => setOutcome(false)}>
                  <div className="text-center">
                    <XCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
                    <span>Resolve NO</span>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Resolution</DialogTitle>
                  <DialogDescription>
                    Resolve "{question.title}" as <strong>NO</strong>? This cannot be undone. {forecastCount} forecast{forecastCount !== 1 ? "s" : ""} will be scored.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOutcome(null)}>Cancel</Button>
                  <Button onClick={handleResolve} disabled={loading}>
                    {loading ? "Resolving..." : "Confirm NO"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
