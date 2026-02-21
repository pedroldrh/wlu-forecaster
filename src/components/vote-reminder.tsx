"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const STORAGE_KEY = "forecaster-vote-reminder-last";
const REMINDER_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours

export function VoteReminder() {
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;

    // Don't show too frequently
    const last = localStorage.getItem(STORAGE_KEY);
    if (last && Date.now() - parseInt(last, 10) < REMINDER_INTERVAL_MS) return;

    const supabase = createClient();

    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get live season
      const { data: season } = await supabase
        .from("seasons")
        .select("id")
        .eq("status", "LIVE")
        .single();
      if (!season) return;

      // Get all question IDs for this season
      const { data: questions } = await supabase
        .from("questions")
        .select("id, status")
        .eq("season_id", season.id);
      if (!questions || questions.length === 0) return;

      const openQuestions = questions.filter((q) => q.status === "OPEN");

      // Get user's forecasts
      const { data: forecasts } = await supabase
        .from("forecasts")
        .select("question_id")
        .eq("user_id", user.id)
        .in("question_id", questions.map((q) => q.id));

      const forecastedIds = new Set((forecasts ?? []).map((f) => f.question_id));
      const totalForecasted = forecastedIds.size;
      const unvotedOpen = openQuestions.filter((q) => !forecastedIds.has(q.id)).length;

      if (totalForecasted < 5 && unvotedOpen > 0) {
        const remaining = 5 - totalForecasted;
        shown.current = true;
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
        toast.info(
          `You need ${remaining} more forecast${remaining !== 1 ? "s" : ""} to qualify for prizes — ${unvotedOpen} open market${unvotedOpen !== 1 ? "s" : ""} waiting!`,
          {
            duration: 8000,
            action: {
              label: "Vote now",
              onClick: () => { window.location.href = "/questions"; },
            },
          }
        );
      }
    }

    // Small delay so it doesn't fire on initial page load
    const timer = setTimeout(check, 2000);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
