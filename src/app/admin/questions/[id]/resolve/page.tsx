import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { ResolveForm } from "./resolve-form";

export default async function ResolveQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/");

  const question = await prisma.question.findUnique({
    where: { id },
    include: { _count: { select: { forecasts: true } } },
  });
  if (!question) notFound();
  if (question.status === "RESOLVED") redirect("/admin/questions");

  return <ResolveForm question={JSON.parse(JSON.stringify(question))} forecastCount={question._count.forecasts} />;
}
