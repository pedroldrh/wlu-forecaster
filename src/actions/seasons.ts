"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") throw new Error("Admin access required");
  return { user, supabase };
}

export async function createSeason(data: {
  name: string;
  startDate: string;
  endDate: string;
  prize1stCents: number;
  prize2ndCents: number;
  prize3rdCents: number;
  prize4thCents: number;
  prize5thCents: number;
  prizeBonusCents: number;
  minParticipationPct: number;
}) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("seasons").insert({
    name: data.name,
    start_date: data.startDate,
    end_date: data.endDate,
    entry_fee_cents: 0,
    prize_1st_cents: data.prize1stCents,
    prize_2nd_cents: data.prize2ndCents,
    prize_3rd_cents: data.prize3rdCents,
    prize_4th_cents: data.prize4thCents,
    prize_5th_cents: data.prize5thCents,
    prize_bonus_cents: data.prizeBonusCents,
    min_participation_pct: data.minParticipationPct,
    status: "DRAFT",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/seasons");
}

export async function updateSeason(id: string, data: {
  name?: string;
  startDate?: string;
  endDate?: string;
  prize1stCents?: number;
  prize2ndCents?: number;
  prize3rdCents?: number;
  prize4thCents?: number;
  prize5thCents?: number;
  prizeBonusCents?: number;
  minParticipationPct?: number;
  status?: string;
}) {
  const { supabase } = await requireAdmin();
  const updateData: Record<string, unknown> = {};
  if (data.name) updateData.name = data.name;
  if (data.startDate) updateData.start_date = data.startDate;
  if (data.endDate) updateData.end_date = data.endDate;
  if (data.prize1stCents !== undefined) updateData.prize_1st_cents = data.prize1stCents;
  if (data.prize2ndCents !== undefined) updateData.prize_2nd_cents = data.prize2ndCents;
  if (data.prize3rdCents !== undefined) updateData.prize_3rd_cents = data.prize3rdCents;
  if (data.prize4thCents !== undefined) updateData.prize_4th_cents = data.prize4thCents;
  if (data.prize5thCents !== undefined) updateData.prize_5th_cents = data.prize5thCents;
  if (data.prizeBonusCents !== undefined) updateData.prize_bonus_cents = data.prizeBonusCents;
  if (data.minParticipationPct !== undefined) updateData.min_participation_pct = data.minParticipationPct;
  if (data.status) updateData.status = data.status;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await supabase.from("seasons").update(updateData as any).eq("id", id);
  revalidatePath("/admin/seasons");
  revalidatePath("/");
}
