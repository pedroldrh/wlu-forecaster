import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { EditQuestionForm } from "./edit-form";

export default async function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") redirect("/");

  const { data: question } = await supabase.from("questions").select("*").eq("id", id).single();
  if (!question) notFound();

  const formQuestion = {
    id: question.id,
    title: question.title,
    description: question.description,
    category: question.category,
    closeTime: question.close_time,
    resolveTime: question.resolve_time,
  };

  return <EditQuestionForm question={formQuestion} />;
}
