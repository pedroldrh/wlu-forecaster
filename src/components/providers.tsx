"use client";

import { Toaster } from "@/components/ui/sonner";
import { OnboardingModal } from "@/components/onboarding-modal";
import { VoteReminder } from "@/components/vote-reminder";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { PushPrompt } from "@/components/push-prompt";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
      <OnboardingModal />
      <VoteReminder />
      <ServiceWorkerRegister />
      <PushPrompt />
    </>
  );
}
