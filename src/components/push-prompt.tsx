"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { savePushSubscription } from "@/actions/push-subscriptions";

async function subscribeToPush() {
  const reg = await navigator.serviceWorker.ready;
  // iOS needs a brief pause after granting permission before pushManager is ready
  await new Promise((r) => setTimeout(r, 500));
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  });
  const json = sub.toJSON();
  await savePushSubscription({
    endpoint: json.endpoint!,
    keys: { p256dh: json.keys!.p256dh!, auth: json.keys!.auth! },
  });
}

function showPushToast() {
  localStorage.setItem("push-prompted", "1");
  toast("Get notified about new markets and results?", {
    duration: 15000,
    action: {
      label: "Enable",
      onClick: () => {
        Notification.requestPermission().then((perm) => {
          if (perm === "granted") subscribeToPush().catch(() => {});
        });
      },
    },
    cancel: {
      label: "Not now",
      onClick: () => {},
    },
  });
}

export function PushPrompt() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    // Already granted — check if subscription exists, if not try to create one
    if (Notification.permission === "granted") {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((existing) => {
          if (!existing) {
            subscribeToPush().catch((err) => console.error("Push subscribe failed:", err));
          } else {
            // Re-save to DB in case it was lost
            const json = existing.toJSON();
            savePushSubscription({
              endpoint: json.endpoint!,
              keys: { p256dh: json.keys!.p256dh!, auth: json.keys!.auth! },
            }).catch(() => {});
          }
        });
      }).catch(() => {});
      return;
    }

    // Already denied or already prompted
    if (Notification.permission === "denied") return;
    if (localStorage.getItem("push-prompted")) return;

    // Check if onboarding is still pending (not yet seen/completed)
    const onboardingSeen = localStorage.getItem("forecaster-onboarding-seen");
    const onboardingCompleted = localStorage.getItem("forecaster-onboarding-completed");
    const onboardingPending = !onboardingSeen && !onboardingCompleted;

    if (onboardingPending) {
      // Wait for onboarding to close, then show after 3s delay
      function handleOnboardingClosed() {
        window.removeEventListener("onboarding-closed", handleOnboardingClosed);
        setTimeout(showPushToast, 3000);
      }
      window.addEventListener("onboarding-closed", handleOnboardingClosed);
      return () => window.removeEventListener("onboarding-closed", handleOnboardingClosed);
    }

    // Onboarding already done — show after normal delay
    const timer = setTimeout(showPushToast, 5000);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
