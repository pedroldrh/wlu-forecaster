"use client";

import { useRouter } from "next/navigation";
import { VoteButtons } from "@/components/forecast-slider";
import { submitForecast } from "@/actions/forecasts";
import { toast } from "sonner";

interface ForecastFormProps {
  questionId: string;
  currentVote: boolean | null;
  redirectTo?: string;
}

export function ForecastForm({ questionId, currentVote, redirectTo }: ForecastFormProps) {
  const router = useRouter();

  const handleSubmit = async (vote: boolean) => {
    if (redirectTo) {
      router.push(`/signin?next=${encodeURIComponent(redirectTo)}`);
      return;
    }
    try {
      await submitForecast(questionId, vote);
      toast.success(vote ? "Voted YES!" : "Voted NO!");
      router.push("/questions");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit vote");
    }
  };

  return <VoteButtons currentVote={currentVote} onSubmit={handleSubmit} />;
}
