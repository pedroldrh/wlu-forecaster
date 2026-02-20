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
    entryFeeCents: season.entry_fee_cents,
    status: season.status,
  };

  return <EditSeasonForm season={formSeason} />;
}
