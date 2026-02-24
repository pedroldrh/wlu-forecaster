"use client";

import { useState, useEffect } from "react";
import { Bell, BellSlash, BellRinging } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { savePushSubscription } from "@/actions/push-subscriptions";
import { toast } from "sonner";

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

type Status = "loading" | "granted" | "denied" | "prompt" | "unsupported";

export function EnableNotificationsButton() {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    setStatus(Notification.permission as "granted" | "denied" | "prompt");
  }, []);

  if (status === "loading" || status === "unsupported") return null;

  async function handleEnable() {
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      try {
        await subscribeToPush();
        setStatus("granted");
        toast.success("Notifications enabled!");
      } catch (err) {
        // Permission granted but subscription failed — let them retry
        setStatus("prompt");
        console.error("Push subscription failed:", err);
        toast.error("Something went wrong. Try again.");
      }
    } else if (perm === "denied") {
      setStatus("denied");
      toast.error("Notifications blocked. You can change this in your browser settings.");
    }
  }

  if (status === "granted") {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <BellRinging className="h-4 w-4" />
        Notifications on
      </Button>
    );
  }

  if (status === "denied") {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2 text-muted-foreground">
        <BellSlash className="h-4 w-4" />
        Notifications blocked
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={handleEnable} className="gap-2">
      <Bell className="h-4 w-4" />
      Enable notifications
    </Button>
  );
}
