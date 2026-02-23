import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NewQuestionForm } from "./new-question-form";

export default async function NewQuestionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "ADMIN") redirect("/");

  const { data: seasons } = await supabase
    .from("seasons")
    .select("id, name")
    .order("created_at", { ascending: false });

  return <NewQuestionForm seasons={seasons ?? []} />;
}
