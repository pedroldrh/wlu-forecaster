"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { exportSeasonCSV, finalizeSeason, createPrizeClaims } from "@/actions/export";
import { toast } from "sonner";
import { Download, Lock, Trophy } from "lucide-react";

export function ExportActions({ seasonId, status }: { seasonId: string; status: string }) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const csv = await exportSeasonCSV(seasonId);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `forecaster-${seasonId}-rankings.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded!");
    } catch (error) {
      toast.error("Failed to export");
    } finally {
      setLoading(false);
    }
  }

  async function handleFinalize() {
    setLoading(true);
    try {
      await finalizeSeason(seasonId);
      toast.success("Season finalized!");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to finalize season");
    } finally {
      setLoading(false);
    }
  }

  async function handleGeneratePrizes() {
    setLoading(true);
    try {
      const result = await createPrizeClaims(seasonId);
      toast.success(`Generated ${result.claims} prize claims!`);
    } catch (error) {
      toast.error("Failed to generate prize claims");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-3">
      {status === "LIVE" && (
        <Button variant="outline" onClick={handleFinalize} disabled={loading}>
          <Lock className="mr-2 h-4 w-4" />
          Finalize Season
        </Button>
      )}
      {status === "ENDED" && (
        <Button variant="outline" onClick={handleGeneratePrizes} disabled={loading}>
          <Trophy className="mr-2 h-4 w-4" />
          Generate Prize Claims
        </Button>
      )}
      <Button onClick={handleExport} disabled={loading}>
        <Download className="mr-2 h-4 w-4" />
        Export CSV
      </Button>
    </div>
  );
}
