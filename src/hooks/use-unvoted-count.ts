"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useUnvotedCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    async function fetchCount() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setCount(0); return; }

      const { data: season } = await supabase
        .from("seasons")
        .select("id")
        .eq("status", "LIVE")
        .single();
      if (!season) { setCount(0); return; }

      const { data: questions } = await supabase
        .from("questions")
        .select("id, status")
        .eq("season_id", season.id);
      if (!questions || questions.length === 0) { setCount(0); return; }

      const openQuestions = questions.filter((q) => q.status === "OPEN");
      if (openQuestions.length === 0) { setCount(0); return; }

      const { data: forecasts } = await supabase
        .from("forecasts")
        .select("question_id")
        .eq("user_id", user.id)
        .in("question_id", openQuestions.map((q) => q.id));

      const forecastedIds = new Set((forecasts ?? []).map((f) => f.question_id));
      const unvoted = openQuestions.filter((q) => !forecastedIds.has(q.id)).length;
      setCount(unvoted);
    }

    fetchCount();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchCount();
    });

    return () => subscription.unsubscribe();
  }, []);

  return count;
}
