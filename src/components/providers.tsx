"use client";

import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { VoteReminder } from "@/components/vote-reminder";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { PushPrompt } from "@/components/push-prompt";
import { SplashScreen } from "@/components/splash-screen";
import { InstallPrompt } from "@/components/install-prompt";
import { UserTypeGate } from "@/components/user-type-gate";

export function Providers({ children }: { children: React.ReactNode }) {
  // Clear the inline blue background set on <body> for PWA splash continuity
  useEffect(() => {
    document.body.style.backgroundColor = "";
  }, []);

  return (
    <>
      <SplashScreen />
      <UserTypeGate>
      {children}
      </UserTypeGate>
      <Toaster />
      <VoteReminder />
      <ServiceWorkerRegister />
      <PushPrompt />
      <InstallPrompt />
    </>
  );
}
