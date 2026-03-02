"use client";

import { useEffect, useState } from "react";
import { Clock } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  targetDate: Date | string;
  className?: string;
}

export function CountdownTimer({ targetDate, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState("");
  const [urgency, setUrgency] = useState<"normal" | "soon" | "critical" | "closed">("normal");

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft("Closed");
        setUrgency("closed");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setUrgency("normal");
        setTimeLeft(`Closes in ${days}d ${hours}h`);
      } else if (hours > 0) {
        setUrgency("soon");
        setTimeLeft(`${hours}h ${minutes}m left`);
      } else {
        setUrgency("critical");
        setTimeLeft(`${minutes}m ${seconds}s left`);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const urgencyClass =
    urgency === "critical"
      ? "text-red-600 bg-red-500/10 border-red-500/30"
      : urgency === "soon"
        ? "text-amber-600 bg-amber-500/10 border-amber-500/30"
        : urgency === "closed"
          ? "text-muted-foreground bg-muted border-border"
          : "text-muted-foreground bg-muted/40 border-border/60";

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5", urgencyClass, className)}>
      <Clock className="inline h-3.5 w-3.5 mr-1 shrink-0" />
      {timeLeft}
    </span>
  );
}
