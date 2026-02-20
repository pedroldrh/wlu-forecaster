"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createSeason } from "@/actions/seasons";
import { toast } from "sonner";

export default function NewSeasonPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await createSeason({
        name: form.get("name") as string,
        startDate: form.get("startDate") as string,
        endDate: form.get("endDate") as string,
        entryFeeCents: Math.round(parseFloat(form.get("entryFee") as string) * 100),
      });
      toast.success("Season created!");
      router.push("/admin/seasons");
    } catch (error) {
      toast.error("Failed to create season");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Season</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Spring 2026" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" name="startDate" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" name="endDate" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entryFee">Entry Fee ($)</Label>
              <Input id="entryFee" name="entryFee" type="number" step="0.01" min="0" placeholder="25.00" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Season"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
