"use client";

import { Toaster } from "@/components/ui/sonner";
import { OnboardingModal } from "@/components/onboarding-modal";
import { VoteReminder } from "@/components/vote-reminder";
import { InstallPrompt, InstallFab } from "@/components/install-prompt";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
      <OnboardingModal />
      <VoteReminder />
      <InstallPrompt />
      <InstallFab />
    </>
  );
}
