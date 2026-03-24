"use client";

import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { VoteReminder } from "@/components/vote-reminder";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { PushPrompt } from "@/components/push-prompt";
import { SplashScreen } from "@/components/splash-screen";
import { InstallPrompt } from "@/components/install-prompt";
import { UserTypeGate } from "@/components/user-type-gate";
import { createClient } from "@/lib/supabase/client";
import { SuggestQuestion, openSuggestDialog } from "@/components/suggest-question";

function SuggestNudge() {
  useEffect(() => {
    // Don't nudge if user has already been nudged this session
    if (sessionStorage.getItem("suggest-nudged")) return;
    const timer = setTimeout(() => {
      sessionStorage.setItem("suggest-nudged", "1");
      openSuggestDialog();
    }, 3 * 60 * 1000); // 3 minutes
    return () => clearTimeout(timer);
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Clear the inline blue background set on <body> for PWA splash continuity
  // and prefetch all page data during splash
  useEffect(() => {
    document.body.style.backgroundColor = "";

    // Prefetch all page data in parallel so everything is cached when splash ends
    fetch("/api/feed", { cache: "no-store" }).catch(() => {});
    fetch("/api/leaderboard", { cache: "no-store" }).catch(() => {});
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) fetch(`/api/profile/${user.id}`, { cache: "no-store" }).catch(() => {});
    });
  }, []);

  return (
    <>
      <SplashScreen />
      <UserTypeGate>
      {children}
      </UserTypeGate>
      <SuggestQuestion showButton={false} />
      <SuggestNudge />
      <Toaster />
      <VoteReminder />
      <ServiceWorkerRegister />
      <PushPrompt />
      <InstallPrompt />
    </>
  );
}
