"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BarChart3, Menu, X, User, LogOut, Shield } from "lucide-react";
import { useState } from "react";

export function Nav() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: "/", label: "Home" },
    { href: "/questions", label: "Questions" },
    { href: "/leaderboard", label: "Leaderboard" },
  ];

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <BarChart3 className="h-5 w-5" />
            Forecaster
          </Link>
          <div className="hidden md:flex items-center gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {session?.user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Admin
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt=""
                      className="h-6 w-6 rounded-full"
                    />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    {session.user.name || "Account"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/u/${session.user.id}`}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                {session.user.role === "ADMIN" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" onClick={() => signIn("github")}>
              Sign in
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t px-4 py-3 space-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm py-1 text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          {session?.user?.role === "ADMIN" && (
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="block text-sm py-1 text-muted-foreground hover:text-foreground"
            >
              Admin
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
