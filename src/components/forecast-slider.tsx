"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";


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
  const [inputText, setInputText] = useState(String(defaultValue));
  const [submitting, setSubmitting] = useState(false);

  const handleSliderChange = ([v]: number[]) => {
    setValue(v);
    setInputText(String(v));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputText(raw);
    const n = parseInt(raw);
    if (!isNaN(n) && n >= 0 && n <= 100) {
      setValue(n);
    }
  };

  const handleInputBlur = () => {
    setInputText(String(value));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(value / 100);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <Slider
            value={[value]}
            onValueChange={handleSliderChange}
            min={0}
            max={100}
            step={1}
            disabled={disabled || submitting}
          />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            value={inputText}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            className="w-16 sm:w-20 text-center font-mono text-lg text-primary"
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
