"use client";

import { useMemo } from "react";
import { Download } from "@phosphor-icons/react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type InstallPlatform = "ios" | "android" | "desktop";

function detectPlatform(): InstallPlatform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

export function InstallInstructionsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const platform = useMemo(detectPlatform, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" weight="bold" />
            Get the Forecaster App
          </DialogTitle>
          <DialogDescription>
            Install Forecaster on your device for the best experience - instant access, push notifications, and it works offline.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {platform === "ios" && (
            <>
              <Step num={1}>
                Tap the <strong>three dots</strong> <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">...</span> at the bottom-right of Safari
              </Step>
              <Step num={2}>
                Tap the <strong>Share</strong> button <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">^</span>
              </Step>
              <Step num={3}>
                Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>
              </Step>
              <Step num={4}>
                Tap <strong>&quot;Add&quot;</strong> in the top-right corner - done!
              </Step>
              <p className="text-xs text-muted-foreground italic pt-1">
                On older iOS versions, tap the Share button directly at the bottom of Safari instead of the three dots.
              </p>
            </>
          )}
          {platform === "android" && (
            <>
              <Step num={1}>
                Tap the <strong>three dots</strong> <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">...</span> at the top-right of Chrome
              </Step>
              <Step num={2}>
                Tap <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>
              </Step>
              <Step num={3}>
                Tap <strong>&quot;Install&quot;</strong> on the confirmation popup - done!
              </Step>
            </>
          )}
          {platform === "desktop" && (
            <>
              <Step num={1}>
                Look for the <strong>install icon</strong> <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">+</span> in the right side of your browser&apos;s address bar
              </Step>
              <Step num={2}>
                Click it and then click <strong>&quot;Install&quot;</strong> - done!
              </Step>
              <p className="text-xs text-muted-foreground italic pt-1">
                If you don&apos;t see the icon, open the browser menu (...) and look for &quot;Install Forecaster&quot; or &quot;Install app&quot;.
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
