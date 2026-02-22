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
        prize1stCents: Math.round(parseFloat(form.get("prize1st") as string) * 100),
        prize2ndCents: Math.round(parseFloat(form.get("prize2nd") as string) * 100),
        prize3rdCents: Math.round(parseFloat(form.get("prize3rd") as string) * 100),
        prize4thCents: Math.round(parseFloat(form.get("prize4th") as string) * 100),
        prize5thCents: Math.round(parseFloat(form.get("prize5th") as string) * 100),
        prizeBonusCents: Math.round(parseFloat(form.get("prizeBonus") as string) * 100),
        minParticipationPct: parseInt(form.get("minParticipation") as string),
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
              <Label htmlFor="prize1st">1st Prize ($)</Label>
              <Input id="prize1st" name="prize1st" type="number" step="1" min="0" placeholder="600" defaultValue="600" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prize2nd">2nd Prize ($)</Label>
              <Input id="prize2nd" name="prize2nd" type="number" step="1" min="0" placeholder="250" defaultValue="250" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prize3rd">3rd Prize ($)</Label>
              <Input id="prize3rd" name="prize3rd" type="number" step="1" min="0" placeholder="150" defaultValue="150" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prize4th">4th Prize ($)</Label>
              <Input id="prize4th" name="prize4th" type="number" step="1" min="0" placeholder="100" defaultValue="100" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prize5th">5th Prize ($)</Label>
              <Input id="prize5th" name="prize5th" type="number" step="1" min="0" placeholder="75" defaultValue="75" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prizeBonus">Bonus Prize ($)</Label>
              <Input id="prizeBonus" name="prizeBonus" type="number" step="1" min="0" placeholder="50" defaultValue="50" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minParticipation">Min Participation (%)</Label>
              <Input id="minParticipation" name="minParticipation" type="number" min="0" max="100" placeholder="70" defaultValue="70" required />
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
