"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Bell, Download } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { useNotificationCount } from "@/hooks/use-notification-count";
import { markAllRead } from "@/actions/notifications";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const INSTALL_DISMISS_KEY = "install-prompt-dismissed-v2";

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

export function NotificationBell({ userId }: { userId: string }) {
  const count = useNotificationCount();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // PWA install prompt state
  const [installDismissed, setInstallDismissed] = useState(true);
  const [standalone, setStandalone] = useState(true);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
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

  function handleOpenInstallDialog() {
    setOpen(false);
    setShowInstallDialog(true);
  }

  function handleCloseInstallDialog() {
    setShowInstallDialog(false);
    handleDismissInstall();
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
    <>
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
              <button
                onClick={handleOpenInstallDialog}
                className="w-full text-left px-4 py-3 border-b bg-primary/5 hover:bg-primary/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Download className="h-4.5 w-4.5 text-primary" weight="bold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-snug">Get the Forecaster app</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tap here to learn how to install
                    </p>
                  </div>
                  <span className="text-primary text-lg">›</span>
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

      {/* Install instructions dialog */}
      <Dialog open={showInstallDialog} onOpenChange={(v) => { if (!v) handleCloseInstallDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" weight="bold" />
              Get the Forecaster App
            </DialogTitle>
            <DialogDescription>
              Install Forecaster on your device for the best experience — instant access, push notifications, and it works offline.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {platform === "ios" && (
              <>
                <Step num={1}>
                  Tap the <strong>three dots</strong> <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">•••</span> at the bottom-right of Safari
                </Step>
                <Step num={2}>
                  Tap the <strong>Share</strong> button <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">↑</span>
                </Step>
                <Step num={3}>
                  Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>
                </Step>
                <Step num={4}>
                  Tap <strong>&quot;Add&quot;</strong> in the top-right corner — done!
                </Step>
                <p className="text-xs text-muted-foreground italic pt-1">
                  On older iOS versions, tap the Share button (↑) directly at the bottom of Safari instead of the three dots.
                </p>
              </>
            )}
            {platform === "android" && (
              <>
                <Step num={1}>
                  Tap the <strong>three dots</strong> <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">⋮</span> at the top-right of Chrome
                </Step>
                <Step num={2}>
                  Tap <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>
                </Step>
                <Step num={3}>
                  Tap <strong>&quot;Install&quot;</strong> on the confirmation popup — done!
                </Step>
              </>
            )}
            {platform === "desktop" && (
              <>
                <Step num={1}>
                  Look for the <strong>install icon</strong> <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">⊕</span> in the right side of your browser&apos;s address bar
                </Step>
                <Step num={2}>
                  Click it and then click <strong>&quot;Install&quot;</strong> — done!
                </Step>
                <p className="text-xs text-muted-foreground italic pt-1">
                  If you don&apos;t see the icon, open the browser menu (⋮) and look for &quot;Install Forecaster&quot; or &quot;Install app&quot;.
                </p>
              </>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button className="w-full">Got it</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Step({ num, children }: { num: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center mt-0.5">
        {num}
      </span>
      <p className="text-sm leading-relaxed">{children}</p>
    </div>
  );
}
