"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateDisplayName(displayName: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const trimmed = displayName.trim();
  if (trimmed.length < 1 || trimmed.length > 30) {
    throw new Error("Display name must be 1-30 characters");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: trimmed })
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath(`/u/${user.id}`);
  revalidatePath("/leaderboard");
  return { success: true };
}
