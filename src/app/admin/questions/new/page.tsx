"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createQuestion } from "@/actions/questions";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";
import { toast } from "sonner";

export default function NewQuestionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("OTHER");
  const [seasonId, setSeasonId] = useState("");
  const [seasons, setSeasons] = useState<{id: string; name: string}[]>([]);

  useEffect(() => {
    fetch("/api/auth/session").then(() => {
      // We'd normally fetch seasons via a server action, but for simplicity
      // we'll use the first LIVE season. For the admin form we need a seasonId.
    });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await createQuestion({
        seasonId: form.get("seasonId") as string,
        title: form.get("title") as string,
        description: form.get("description") as string,
        category: category as any,
        closeTime: form.get("closeTime") as string,
        resolveTime: form.get("resolveTime") as string,
      });
      toast.success("Question created!");
      router.push("/admin/questions");
    } catch (error) {
      toast.error("Failed to create question");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Question</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seasonId">Season ID</Label>
              <Input id="seasonId" name="seasonId" placeholder="spring-2026" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" placeholder="Will X happen?" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description / Resolution Criteria</Label>
              <Textarea id="description" name="description" placeholder="Resolves YES if..." required />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="closeTime">Close Time</Label>
              <Input id="closeTime" name="closeTime" type="datetime-local" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resolveTime">Resolve Time</Label>
              <Input id="resolveTime" name="resolveTime" type="datetime-local" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Question"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
