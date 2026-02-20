"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateSeason } from "@/actions/seasons";
import { toast } from "sonner";

interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  entryFeeCents: number;
  status: string;
}

export function EditSeasonForm({ season }: { season: Season }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(season.status);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await updateSeason(season.id, {
        name: form.get("name") as string,
        startDate: form.get("startDate") as string,
        endDate: form.get("endDate") as string,
        entryFeeCents: Math.round(parseFloat(form.get("entryFee") as string) * 100),
        status: status as any,
      });
      toast.success("Season updated!");
      router.push("/admin/seasons");
    } catch (error) {
      toast.error("Failed to update season");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Season</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={season.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" name="startDate" type="date" defaultValue={season.startDate.split("T")[0]} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" name="endDate" type="date" defaultValue={season.endDate.split("T")[0]} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entryFee">Entry Fee ($)</Label>
              <Input id="entryFee" name="entryFee" type="number" step="0.01" defaultValue={(season.entryFeeCents / 100).toFixed(2)} required />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="LIVE">Live</SelectItem>
                  <SelectItem value="ENDED">Ended</SelectItem>
                  <SelectItem value="PAYOUTS_SENT">Payouts Sent</SelectItem>
                </SelectContent>
              </Select>
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
