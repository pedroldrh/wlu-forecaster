"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { savePushSubscription } from "@/actions/push-subscriptions";

async function subscribeToPush() {
  const reg = await navigator.serviceWorker.ready;
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

export function PushPrompt() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    // Already granted — silently re-register
    if (Notification.permission === "granted") {
      subscribeToPush().catch(() => {});
      return;
    }

    // Already denied or already prompted
    if (Notification.permission === "denied") return;
    if (localStorage.getItem("push-prompted")) return;

    const timer = setTimeout(() => {
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
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
