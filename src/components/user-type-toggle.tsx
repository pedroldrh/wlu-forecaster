"use client";

import { useState, useEffect } from "react";
import { GraduationCap, Scales } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { setUserType } from "@/actions/user-type";
import { Card, CardContent } from "@/components/ui/card";

export function UserTypeToggle() {
  const [current, setCurrent] = useState<"UNDERGRAD" | "LAW" | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      createClient()
        .from("profiles")
        .select("user_type")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          setCurrent(data?.user_type as "UNDERGRAD" | "LAW" | null);
          setLoading(false);
        });
    });
  }, []);

  async function handleToggle(type: "UNDERGRAD" | "LAW") {
    if (type === current || submitting) return;
    setSubmitting(true);
    try {
      await setUserType(type);
      setCurrent(type);
      // Clear the module-level cache so the feed re-filters
      window.location.reload();
    } catch {
      setSubmitting(false);
    }
  }

  if (loading || !current) return null;

  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">I am a...</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleToggle("UNDERGRAD")}
            disabled={submitting}
            className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all active:scale-[0.96] ${
              current === "UNDERGRAD"
                ? "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30"
                : "bg-white/5 text-white/40"
            }`}
          >
            <GraduationCap className="h-4.5 w-4.5" weight={current === "UNDERGRAD" ? "fill" : "regular"} />
            Undergrad
          </button>
          <button
            onClick={() => handleToggle("LAW")}
            disabled={submitting}
            className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all active:scale-[0.96] ${
              current === "LAW"
                ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/30"
                : "bg-white/5 text-white/40"
            }`}
          >
            <Scales className="h-4.5 w-4.5" weight={current === "LAW" ? "fill" : "regular"} />
            Law Student
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
