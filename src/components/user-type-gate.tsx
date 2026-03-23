"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { setUserType } from "@/actions/user-type";
import { GraduationCap, Scales } from "@phosphor-icons/react";

// "skip" means not logged in (don't gate), undefined means still loading
let cachedUserType: "UNDERGRAD" | "LAW" | null | "skip" | undefined = undefined;

export function UserTypeGate({ children }: { children: React.ReactNode }) {
  const [userType, setUserTypeState] = useState<"UNDERGRAD" | "LAW" | null | "skip" | undefined>(cachedUserType);
  const [loading, setLoading] = useState(cachedUserType === undefined);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (cachedUserType !== undefined) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        cachedUserType = "skip";
        setUserTypeState("skip");
        setLoading(false);
        return;
      }

      supabase
        .from("profiles")
        .select("user_type")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          const ut = data?.user_type as "UNDERGRAD" | "LAW" | null;
          cachedUserType = ut;
          setUserTypeState(ut);
          setLoading(false);
        });
    });

    // Also listen for sign-in to re-check
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        cachedUserType = undefined;
        setUserTypeState(undefined);
        setLoading(true);
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (!user) { setLoading(false); return; }
          supabase
            .from("profiles")
            .select("user_type")
            .eq("id", user.id)
            .single()
            .then(({ data }) => {
              const ut = data?.user_type as "UNDERGRAD" | "LAW" | null;
              cachedUserType = ut;
              setUserTypeState(ut);
              setLoading(false);
            });
        });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSelect(type: "UNDERGRAD" | "LAW") {
    setSubmitting(true);
    try {
      await setUserType(type);
      cachedUserType = type;
      setUserTypeState(type);
    } catch {
      setSubmitting(false);
    }
  }

  // Still checking — show nothing
  if (loading) return null;

  // Not logged in or already has a type — show the app
  if (userType === "skip" || userType === "UNDERGRAD" || userType === "LAW") return <>{children}</>;

  // userType is null (logged in but no type) — show full-screen gate
  return (
    <div className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center px-8">
      <div className="max-w-sm w-full space-y-8 text-center">
        <div className="space-y-3">
          <h1 className="text-3xl font-black text-white">Welcome to Forecaster</h1>
          <p className="text-white/50 text-sm">One quick thing — which best describes you?</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleSelect("UNDERGRAD")}
            disabled={submitting}
            className="w-full rounded-2xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/10 p-5 flex items-center gap-4 active:scale-[0.97] transition-all disabled:opacity-50"
          >
            <div className="h-14 w-14 rounded-2xl bg-blue-500/20 flex items-center justify-center shrink-0">
              <GraduationCap className="h-7 w-7 text-blue-400" weight="duotone" />
            </div>
            <div className="text-left">
              <p className="text-lg font-bold text-white">I'm an Undergrad</p>
              <p className="text-xs text-white/40">See all campus markets</p>
            </div>
          </button>

          <button
            onClick={() => handleSelect("LAW")}
            disabled={submitting}
            className="w-full rounded-2xl bg-gradient-to-r from-red-600/20 to-amber-600/20 border border-white/10 p-5 flex items-center gap-4 active:scale-[0.97] transition-all disabled:opacity-50"
          >
            <div className="h-14 w-14 rounded-2xl bg-red-500/20 flex items-center justify-center shrink-0">
              <Scales className="h-7 w-7 text-red-400" weight="duotone" />
            </div>
            <div className="text-left">
              <p className="text-lg font-bold text-white">I'm a Law Student</p>
              <p className="text-xs text-white/40">See Law School markets only</p>
            </div>
          </button>
        </div>

        <p className="text-xs text-white/20">You can change this later in your profile</p>
      </div>
    </div>
  );
}

/** Export cached value for other components to read */
export function getCachedUserType(): "UNDERGRAD" | "LAW" | null {
  if (cachedUserType === "UNDERGRAD" || cachedUserType === "LAW") return cachedUserType;
  return null;
}
