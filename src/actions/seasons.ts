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
  entryFeeCents: number;
}) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("seasons").insert({
    name: data.name,
    start_date: data.startDate,
    end_date: data.endDate,
    entry_fee_cents: data.entryFeeCents,
    status: "DRAFT",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/seasons");
}

export async function updateSeason(id: string, data: {
  name?: string;
  startDate?: string;
  endDate?: string;
  entryFeeCents?: number;
  status?: string;
}) {
  const { supabase } = await requireAdmin();
  const updateData: Record<string, any> = {};
  if (data.name) updateData.name = data.name;
  if (data.startDate) updateData.start_date = data.startDate;
  if (data.endDate) updateData.end_date = data.endDate;
  if (data.entryFeeCents !== undefined) updateData.entry_fee_cents = data.entryFeeCents;
  if (data.status) updateData.status = data.status;

  await supabase.from("seasons").update(updateData as any).eq("id", id);
  revalidatePath("/admin/seasons");
  revalidatePath("/");
}
