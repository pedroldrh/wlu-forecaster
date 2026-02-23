"use client";

import { SignOut } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      onClick={handleSignOut}
      className="w-full gap-2 border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-500"
    >
      <SignOut className="h-4 w-4" />
      Sign out
    </Button>
  );
}
