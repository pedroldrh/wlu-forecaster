"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  targetDate: Date | string;
  className?: string;
}

export function CountdownTimer({ targetDate, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft("Closed");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <span className={className}>
      <Clock className="inline h-3.5 w-3.5 mr-1" />
      {timeLeft}
    </span>
  );
}
