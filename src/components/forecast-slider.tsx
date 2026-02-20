"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ForecastSliderProps {
  defaultValue?: number;
  onSubmit: (probability: number) => Promise<void>;
  disabled?: boolean;
}

export function ForecastSlider({
  defaultValue = 50,
  onSubmit,
  disabled = false,
}: ForecastSliderProps) {
  const [value, setValue] = useState(defaultValue);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(value / 100);
    } finally {
      setSubmitting(false);
    }
  };

  const getColor = () => {
    if (value <= 15 || value >= 85) return "text-red-600";
    if (value <= 30 || value >= 70) return "text-orange-500";
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Slider
            value={[value]}
            onValueChange={([v]) => setValue(v)}
            min={0}
            max={100}
            step={1}
            disabled={disabled || submitting}
          />
        </div>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min={0}
            max={100}
            value={value}
            onChange={(e) => {
              const n = parseInt(e.target.value);
              if (!isNaN(n) && n >= 0 && n <= 100) setValue(n);
            }}
            className={cn("w-20 text-center font-mono text-lg", getColor())}
            disabled={disabled || submitting}
          />
          <span className="text-muted-foreground">%</span>
        </div>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Very unlikely</span>
        <span>50/50</span>
        <span>Very likely</span>
      </div>
      <Button
        onClick={handleSubmit}
        disabled={disabled || submitting}
        className="w-full"
      >
        {submitting ? "Submitting..." : defaultValue !== 50 ? "Update Forecast" : "Submit Forecast"}
      </Button>
    </div>
  );
}
