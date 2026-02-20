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
import { createClient } from "@/lib/supabase/client";

export default function NewQuestionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("OTHER");
  const [seasonId, setSeasonId] = useState("");
  const [seasons, setSeasons] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("seasons")
      .select("id, name")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setSeasons(data);
          setSeasonId(data[0].id);
        }
      });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!seasonId) {
      toast.error("Please select a season");
      return;
    }
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await createQuestion({
        seasonId,
        title: form.get("title") as string,
        description: form.get("description") as string,
        category: category as any,
        closeTime: form.get("closeTime") as string,
        resolveTime: form.get("resolveTime") as string,
      });
      toast.success("Question created!");
      router.push("/admin/questions");
    } catch (error: any) {
      toast.error(error?.message || "Failed to create question");
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
              <Label>Season</Label>
              <Select value={seasonId} onValueChange={setSeasonId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a season..." />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
