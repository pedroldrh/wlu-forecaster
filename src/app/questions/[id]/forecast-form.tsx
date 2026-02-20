"use client";

import { ForecastSlider } from "@/components/forecast-slider";
import { submitForecast } from "@/actions/forecasts";
import { toast } from "sonner";

interface ForecastFormProps {
  questionId: string;
  currentProbability: number | null;
}

export function ForecastForm({ questionId, currentProbability }: ForecastFormProps) {
  const handleSubmit = async (probability: number) => {
    try {
      await submitForecast(questionId, probability);
      toast.success("Forecast submitted!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit forecast");
    }
  };

  return (
    <ForecastSlider
      defaultValue={currentProbability !== null ? Math.round(currentProbability * 100) : 50}
      onSubmit={handleSubmit}
    />
  );
}
