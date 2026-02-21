"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart3, Trophy, HelpCircle } from "lucide-react";
import { useUnvotedCount } from "@/hooks/use-unvoted-count";

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/questions", label: "Markets", icon: BarChart3 },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/how-it-works", label: "How It Works", icon: HelpCircle },
];

export function BottomNav() {
  const pathname = usePathname();
  const unvotedCount = useUnvotedCount();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const isActive = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-none">{tab.label}</span>
              {tab.href === "/questions" && unvotedCount > 0 && (
                <span className="absolute top-1.5 left-1/2 ml-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white px-1">
                  {unvotedCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
