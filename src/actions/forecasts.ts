"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function submitForecast(questionId: string, probability: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  if (!session.user.isWluVerified) throw new Error("W&L verification required");
  if (probability < 0 || probability > 1) throw new Error("Probability must be between 0 and 1");

  // Check question is open
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { season: true },
  });
  if (!question) throw new Error("Question not found");
  if (question.status !== "OPEN") throw new Error("Question is not open");
  if (new Date() > question.closeTime) throw new Error("Question has closed");

  // Check user has paid entry for this season
  const entry = await prisma.seasonEntry.findUnique({
    where: {
      userId_seasonId: {
        userId: session.user.id,
        seasonId: question.seasonId,
      },
    },
  });
  if (!entry || entry.status !== "PAID") throw new Error("Paid season entry required");

  // Upsert forecast
  await prisma.forecast.upsert({
    where: {
      userId_questionId: {
        userId: session.user.id,
        questionId,
      },
    },
    update: {
      probability,
      submittedAt: new Date(),
    },
    create: {
      userId: session.user.id,
      questionId,
      probability,
    },
  });

  revalidatePath(`/questions/${questionId}`);
  revalidatePath("/questions");
  revalidatePath("/leaderboard");
  return { success: true };
}
