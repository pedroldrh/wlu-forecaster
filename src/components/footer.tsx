"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  if (pathname === "/signin") return null;

  return (
    <footer className="max-w-7xl mx-auto px-4 pb-20 md:pb-6 text-center text-xs text-muted-foreground space-y-2">
      <div className="flex items-center justify-center gap-3">
        <Link href="/terms" className="hover:text-foreground transition-colors">
          Terms
        </Link>
        <span className="text-muted-foreground/40">&middot;</span>
        <Link href="/privacy" className="hover:text-foreground transition-colors">
          Privacy
        </Link>
        <span className="text-muted-foreground/40">&middot;</span>
        <Link href="/how-it-works" className="hover:text-foreground transition-colors">
          How It Works
        </Link>
      </div>
      <p>&copy; {new Date().getFullYear()} Forecaster</p>
    </footer>
  );
}
