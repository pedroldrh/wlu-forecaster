import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { EditSeasonForm } from "./edit-form";

export default async function EditSeasonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") redirect("/");

  const { data: season } = await supabase.from("seasons").select("*").eq("id", id).single();
  if (!season) notFound();

  const formSeason = {
    id: season.id,
    name: season.name,
    startDate: season.start_date,
    endDate: season.end_date,
    prize1stCents: season.prize_1st_cents,
    prize2ndCents: season.prize_2nd_cents,
    prize3rdCents: season.prize_3rd_cents,
    prize4thCents: season.prize_4th_cents,
    prize5thCents: season.prize_5th_cents,
    prizeBonusCents: season.prize_bonus_cents,
    minParticipationPct: season.min_participation_pct,
    status: season.status,
  };

  return <EditSeasonForm season={formSeason} />;
}
