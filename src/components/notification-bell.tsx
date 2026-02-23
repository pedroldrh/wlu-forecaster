"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Bell, Download } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { useNotificationCount } from "@/hooks/use-notification-count";
import { markAllRead } from "@/actions/notifications";
import Link from "next/link";

const INSTALL_DISMISS_KEY = "install-prompt-dismissed";

type InstallPlatform = "ios" | "android" | "desktop";

function detectPlatform(): InstallPlatform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if ((window.navigator as any).standalone) return true;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  return false;
}

const INSTALL_INSTRUCTIONS: Record<InstallPlatform, string> = {
  ios: 'Tap the Share button (⬆️), then "Add to Home Screen"',
  android: 'Tap the ⋮ menu, then "Install app" or "Add to Home Screen"',
  desktop: "Click the install icon (⊕) in the address bar",
};

export function NotificationBell({ userId }: { userId: string }) {
  const count = useNotificationCount();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // PWA install prompt state
  const [installDismissed, setInstallDismissed] = useState(true);
  const [standalone, setStandalone] = useState(true);
  const platform = useMemo(detectPlatform, []);

  useEffect(() => {
    setStandalone(isStandalone());
    if (!isStandalone()) {
      setInstallDismissed(localStorage.getItem(INSTALL_DISMISS_KEY) === "true");
    }
  }, []);

  const showInstallCard = !standalone && !installDismissed;
  const badgeCount = count + (showInstallCard ? 1 : 0);

  function handleDismissInstall() {
    localStorage.setItem(INSTALL_DISMISS_KEY, "true");
    setInstallDismissed(true);
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
    if (next) fetchNotifications();
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
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center h-9 w-9 rounded-full hover:bg-accent transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
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

          {/* PWA install card */}
          {showInstallCard && (
            <div className="px-4 py-3 border-b bg-primary/5">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <Download className="h-4 w-4 text-primary" weight="bold" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-snug">Download the app</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {INSTALL_INSTRUCTIONS[platform]}
                  </p>
                  <button
                    onClick={handleDismissInstall}
                    className="mt-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
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
  );
}
