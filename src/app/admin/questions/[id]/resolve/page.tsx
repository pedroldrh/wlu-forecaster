import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ResolveForm } from "./resolve-form";

export default async function ResolveQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") redirect("/");

  const { data: question } = await supabase.from("questions").select("*").eq("id", id).single();
  if (!question) notFound();
  if (question.status === "RESOLVED") redirect("/admin/questions");

  const { count: forecastCount } = await supabase
    .from("forecasts")
    .select("*", { count: "exact", head: true })
    .eq("question_id", id);

  return <ResolveForm question={JSON.parse(JSON.stringify(question))} forecastCount={forecastCount ?? 0} />;
}
