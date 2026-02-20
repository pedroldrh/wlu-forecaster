"use client";

import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "@/actions/stripe";
import { useState } from "react";
import { toast } from "sonner";

export function JoinButton({ seasonId }: { seasonId: string }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await createCheckoutSession(seasonId);
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      toast.error("Failed to create checkout session");
      setLoading(false);
    }
  };

  return (
    <Button className="w-full" size="lg" onClick={handleClick} disabled={loading}>
      {loading ? "Redirecting to payment..." : "Pay & Join"}
    </Button>
  );
}
