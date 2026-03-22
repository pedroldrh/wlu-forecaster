"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { WebInstallPage } from "@/components/web-install-page";

function isPWA() {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

// Routes that bypass the PWA gate (auth callbacks, legal pages)
const BYPASS_ROUTES = ["/signin", "/api/", "/terms", "/privacy"];

interface PwaGateProps {
  children: React.ReactNode;
  seasonInfo: { name: string; totalPrizeCents: number } | null;
}

export function PwaGate({ children, seasonInfo }: PwaGateProps) {
  const [isPwaMode, setIsPwaMode] = useState(true); // true to avoid flash
  const pathname = usePathname();

  useEffect(() => {
    setIsPwaMode(isPWA());
  }, []);

  // Allow auth and legal routes through even on web
  const isBypass = BYPASS_ROUTES.some((r) => pathname.startsWith(r));

  if (!isPwaMode && !isBypass) {
    return <WebInstallPage seasonInfo={seasonInfo} />;
  }

  return <>{children}</>;
}
