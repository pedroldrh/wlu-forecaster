"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateQuestion } from "@/actions/questions";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";
import { toast } from "sonner";

interface Question {
  id: string;
  title: string;
  description: string;
  category: string;
  closeTime: string;
  resolveTime: string;
}

export function EditQuestionForm({ question }: { question: Question }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState(question.category);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await updateQuestion(question.id, {
        title: form.get("title") as string,
        description: form.get("description") as string,
        category: category as any,
        closeTime: form.get("closeTime") as string,
        resolveTime: form.get("resolveTime") as string,
      });
      toast.success("Question updated!");
      router.push("/admin/questions");
    } catch (error) {
      toast.error("Failed to update question");
    } finally {
      setLoading(false);
    }
  }

  const formatLocalDate = (d: string) => {
    const date = new Date(d);
    return date.toISOString().slice(0, 16);
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Question</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" defaultValue={question.title} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={question.description} required />
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
              <Input id="closeTime" name="closeTime" type="datetime-local" defaultValue={formatLocalDate(question.closeTime)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resolveTime">Resolve Time</Label>
              <Input id="resolveTime" name="resolveTime" type="datetime-local" defaultValue={formatLocalDate(question.resolveTime)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
