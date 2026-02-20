"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function joinSeason(seasonId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  // TODO: Re-enable once Microsoft OAuth is approved by W&L IT
  // if (!profile?.is_wlu_verified) throw new Error("W&L verification required");

  const { data: season } = await supabase.from("seasons").select("*").eq("id", seasonId).single();
  if (!season) throw new Error("Season not found");
  if (season.status !== "LIVE") throw new Error("Season is not live");

  // Check if already joined
  const { data: existing } = await supabase
    .from("season_entries")
    .select("*")
    .eq("user_id", user.id)
    .eq("season_id", seasonId)
    .single();

  if (existing?.status === "PAID" || existing?.status === "JOINED") {
    throw new Error("Already entered");
  }

  if (existing) {
    // Update PENDING entry to JOINED
    await supabase
      .from("season_entries")
      .update({ status: "JOINED" })
      .eq("user_id", user.id)
      .eq("season_id", seasonId);
  } else {
    await supabase.from("season_entries").insert({
      user_id: user.id,
      season_id: seasonId,
      status: "JOINED",
    });
  }

  revalidatePath("/");
  revalidatePath(`/join/${seasonId}`);
  revalidatePath("/questions");
  return { success: true };
}
