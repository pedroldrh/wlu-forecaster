import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { EditQuestionForm } from "./edit-form";

export default async function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/");

  const question = await prisma.question.findUnique({ where: { id } });
  if (!question) notFound();

  return <EditQuestionForm question={JSON.parse(JSON.stringify(question))} />;
}
