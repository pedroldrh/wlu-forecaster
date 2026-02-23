"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

interface ForecastSliderProps {
  defaultValue?: number;
  onSubmit: (probability: number) => Promise<void>;
  disabled?: boolean;
}

function getConfidenceColor(value: number): string {
  if (value <= 15) return "text-red-500";
  if (value <= 35) return "text-orange-500";
  if (value <= 65) return "text-amber-500";
  if (value <= 85) return "text-blue-500";
  return "text-green-500";
}

function getConfidenceLabel(value: number): string {
  if (value <= 10) return "Almost impossible";
  if (value <= 25) return "Unlikely";
  if (value <= 40) return "Lean no";
  if (value <= 60) return "Toss-up";
  if (value <= 75) return "Lean yes";
  if (value <= 90) return "Likely";
  return "Near certain";
}

export function ForecastSlider({
  defaultValue = 50,
  onSubmit,
  disabled = false,
}: ForecastSliderProps) {
  const [value, setValue] = useState(defaultValue);
  const [submitting, setSubmitting] = useState(false);

  const handleSliderChange = ([v]: number[]) => {
    setValue(v);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(value / 100);
    } finally {
      setSubmitting(false);
    }
  };

  const colorClass = getConfidenceColor(value);
  const label = getConfidenceLabel(value);

  return (
    <div className="space-y-5">
      {/* Big percentage display */}
      <div className="text-center py-2">
        <p className={`text-5xl font-bold font-mono tabular-nums transition-colors duration-200 ${colorClass}`}>
          {value}<span className="text-3xl">%</span>
        </p>
        <p className={`text-sm font-medium mt-2 transition-colors duration-200 ${colorClass}`}>
          {label}
        </p>
      </div>

      {/* Slider */}
      <div className="px-1">
        <Slider
          value={[value]}
          onValueChange={handleSliderChange}
          min={0}
          max={100}
          step={1}
          disabled={disabled || submitting}
        />
        <div className="flex justify-between text-[11px] text-muted-foreground/50 mt-2.5 select-none">
          <span>No way</span>
          <span>Coin flip</span>
          <span>Lock it in</span>
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={disabled || submitting}
        className="w-full h-11 text-base font-semibold rounded-xl"
        size="lg"
      >
        {submitting ? "Submitting..." : defaultValue !== 50 ? "Update Forecast" : "Lock In"}
      </Button>
    </div>
  );
}
