"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Category } from "@prisma/client";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "ADMIN") throw new Error("Admin access required");
  return session.user;
}

export async function createQuestion(data: {
  seasonId: string;
  title: string;
  description: string;
  category: Category;
  closeTime: string;
  resolveTime: string;
}) {
  await requireAdmin();
  const question = await prisma.question.create({
    data: {
      seasonId: data.seasonId,
      title: data.title,
      description: data.description,
      category: data.category,
      closeTime: new Date(data.closeTime),
      resolveTime: new Date(data.resolveTime),
      status: "OPEN",
    },
  });
  revalidatePath("/admin/questions");
  revalidatePath("/questions");
  return question;
}

export async function updateQuestion(id: string, data: {
  title?: string;
  description?: string;
  category?: Category;
  closeTime?: string;
  resolveTime?: string;
}) {
  await requireAdmin();
  const question = await prisma.question.update({
    where: { id },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description && { description: data.description }),
      ...(data.category && { category: data.category }),
      ...(data.closeTime && { closeTime: new Date(data.closeTime) }),
      ...(data.resolveTime && { resolveTime: new Date(data.resolveTime) }),
    },
  });
  revalidatePath("/admin/questions");
  revalidatePath("/questions");
  return question;
}

export async function resolveQuestion(id: string, outcome: boolean) {
  await requireAdmin();
  const question = await prisma.question.findUnique({ where: { id } });
  if (!question) throw new Error("Question not found");
  if (question.status === "RESOLVED") throw new Error("Question already resolved");

  await prisma.question.update({
    where: { id },
    data: {
      status: "RESOLVED",
      resolvedOutcome: outcome,
      resolvedAt: new Date(),
    },
  });

  revalidatePath("/admin/questions");
  revalidatePath("/questions");
  revalidatePath(`/questions/${id}`);
  revalidatePath("/leaderboard");
  return { success: true };
}
