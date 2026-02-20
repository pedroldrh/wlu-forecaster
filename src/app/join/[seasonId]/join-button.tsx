"use client";

import { Button } from "@/components/ui/button";
import { joinSeason } from "@/actions/join";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function JoinButton({ seasonId }: { seasonId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    setLoading(true);
    try {
      await joinSeason(seasonId);
      toast.success("You're in! Start forecasting.");
      router.push("/questions");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to join season");
      setLoading(false);
    }
  };

  return (
    <Button className="w-full" size="lg" onClick={handleClick} disabled={loading}>
      {loading ? "Joining..." : "Join Free"}
    </Button>
  );
}
