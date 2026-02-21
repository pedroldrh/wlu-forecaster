"use client";

import { Toaster } from "@/components/ui/sonner";
import { OnboardingModal } from "@/components/onboarding-modal";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
      <OnboardingModal />
    </>
  );
}
