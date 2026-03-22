"use client";

import { useState, useEffect } from "react";
import { Bell, BellSlash, BellRinging } from "@phosphor-icons/react";
import { savePushSubscription } from "@/actions/push-subscriptions";
import { subscribeToPush } from "@/lib/push-utils";
import { toast } from "sonner";

async function subscribeAndSave() {
  const sub = await subscribeToPush();
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
        await subscribeAndSave();
        setStatus("granted");
        toast.success("Notifications enabled!");
      } catch (err) {
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
      <button disabled className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white/50">
        <BellRinging className="h-4 w-4" />
        Notifications on
      </button>
    );
  }

  if (status === "denied") {
    return (
      <button disabled className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/30">
        <BellSlash className="h-4 w-4" />
        Notifications blocked
      </button>
    );
  }

  return (
    <button onClick={handleEnable} className="flex items-center gap-2 rounded-lg border border-white/20 bg-white text-black px-4 py-2.5 text-sm font-semibold hover:bg-white/90 active:scale-[0.97] transition-all">
      <Bell className="h-4 w-4" />
      Enable notifications
    </button>
  );
}
