"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, BellRinging, Download } from "@phosphor-icons/react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useNotificationCount } from "@/hooks/use-notification-count";
import { markAllRead } from "@/actions/notifications";
import { savePushSubscription } from "@/actions/push-subscriptions";
import { subscribeToPush } from "@/lib/push-utils";
import { InstallInstructionsDialog } from "@/components/install-instructions-dialog";
import { toast } from "sonner";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if ((window.navigator as any).standalone) return true;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  return false;
}

export function NotificationBell({ userId }: { userId: string }) {
  const count = useNotificationCount();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [standalone, setStandalone] = useState(true);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [hasOpenedBell, setHasOpenedBell] = useState(true);
  const [pushStatus, setPushStatus] = useState<"loading" | "granted" | "prompt" | "denied" | "unsupported">("loading");
  const [pushEnabling, setPushEnabling] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStandalone(isStandalone());
    setHasOpenedBell(!!localStorage.getItem("forecaster-bell-opened"));
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushStatus("unsupported");
    } else if (Notification.permission === "denied") {
      setPushStatus("denied");
    } else if (Notification.permission === "granted") {
      // Permission granted but check if we actually have a subscription
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setPushStatus(sub ? "granted" : "prompt");
        });
      }).catch(() => setPushStatus("prompt"));
    } else {
      setPushStatus("prompt");
    }
  }, []);

  async function handleEnablePush() {
    setPushEnabling(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        const sub = await subscribeToPush();
        const json = sub.toJSON();
        await savePushSubscription({
          endpoint: json.endpoint!,
          keys: { p256dh: json.keys!.p256dh!, auth: json.keys!.auth! },
        });
        setPushStatus("granted");
        toast.success("Push notifications enabled!");
      } else {
        setPushStatus(perm as "denied" | "prompt");
        if (perm === "denied") toast.error("Notifications blocked. Check browser settings.");
      }
    } catch (err) {
      console.error("Push enable failed:", err);
      toast.error("Something went wrong. Try again.");
    }
    setPushEnabling(false);
  }

  const showInstallCard = !standalone;
  const showPushCard = pushStatus === "prompt";
  const badgeCount = count + (showInstallCard ? 1 : 0) + (showPushCard ? 1 : 0);
  const shouldRing = showInstallCard && !hasOpenedBell && !open;

  function handleOpenInstallDialog() {
    setOpen(false);
    setShowInstallDialog(true);
  }

  async function fetchNotifications() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    setNotifications(data ?? []);
    setLoading(false);

    if (data && data.some((n: any) => !n.read)) {
      await markAllRead();
    }
  }

  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      fetchNotifications();
      if (!hasOpenedBell) {
        localStorage.setItem("forecaster-bell-opened", "true");
        setHasOpenedBell(true);
      }
    }
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <>
      <div className="relative" ref={panelRef}>
        <button
          onClick={handleOpen}
          className="relative flex items-center justify-center h-9 w-9 rounded-full hover:bg-accent transition-colors"
          aria-label="Notifications"
        >
          <Bell className={`h-5 w-5 ${shouldRing ? "animate-bell-ring" : ""}`} />
          {badgeCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white px-1">
              {badgeCount > 99 ? "99+" : badgeCount}
            </span>
          )}
        </button>

        {open && (
          <div className="fixed right-2 left-2 sm:left-auto sm:absolute sm:right-0 top-[env(safe-area-inset-top,0px)] sm:top-full mt-14 sm:mt-2 sm:w-80 max-h-96 overflow-y-auto rounded-xl border bg-background shadow-lg z-50">
            <div className="px-4 py-3 border-b">
              <p className="font-semibold text-sm">Notifications</p>
            </div>

            {showInstallCard && (
              <button
                onClick={handleOpenInstallDialog}
                className="w-full text-left px-4 py-3 border-b bg-primary/5 hover:bg-primary/10 active:bg-primary/15 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Download className="h-4.5 w-4.5 text-primary" weight="bold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-snug">Get the Forecaster app</p>
                  </div>
                </div>
                <div className="mt-2.5 w-full rounded-lg bg-primary text-primary-foreground text-xs font-semibold text-center py-2">
                  Tap to install
                </div>
              </button>
            )}

            {pushStatus === "prompt" && (
              <button
                onClick={handleEnablePush}
                disabled={pushEnabling}
                className="w-full text-left px-4 py-3 border-b bg-blue-500/5 hover:bg-blue-500/10 active:bg-blue-500/15 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <BellRinging className="h-4 w-4 text-blue-500" weight="bold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-snug">Enable push notifications</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Get alerts even when the app is closed</p>
                  </div>
                </div>
              </button>
            )}

            {loading ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">No notifications yet.</div>
            ) : (
              <div className="divide-y">
                {notifications.map((n: any) => (
                  <Link
                    key={n.id}
                    href={n.link ?? "/"}
                    onClick={() => setOpen(false)}
                    className={`block px-4 py-3 hover:bg-muted/50 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                  >
                    <p className="text-sm font-medium leading-snug">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {new Date(n.created_at).toLocaleDateString()}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <InstallInstructionsDialog open={showInstallDialog} onOpenChange={setShowInstallDialog} />
    </>
  );
}
