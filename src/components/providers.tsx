"use client";

import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { OnboardingModal } from "@/components/onboarding-modal";
import { NavigationProgress } from "@/components/navigation-progress";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      {children}
      <Toaster />
      <OnboardingModal />
    </>
  );
}
