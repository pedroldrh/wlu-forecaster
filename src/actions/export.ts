"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { seasonScore, rankUsers, UserScore } from "@/lib/scoring";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "ADMIN") throw new Error("Admin access required");
  return session.user;
}

export async function getSeasonRankings(seasonId: string) {
  await requireAdmin();

  const entries = await prisma.seasonEntry.findMany({
    where: { seasonId, status: "PAID" },
    include: {
      user: {
        include: {
          forecasts: {
            where: {
              question: {
                seasonId,
                status: "RESOLVED",
              },
            },
            include: {
              question: true,
            },
          },
        },
      },
    },
  });

  const users: UserScore[] = entries.map((entry) => ({
    userId: entry.userId,
    name: entry.user.name || entry.user.email,
    score: seasonScore(
      entry.user.forecasts.map((f) => ({
        probability: f.probability,
        outcome: f.question.resolvedOutcome!,
      }))
    ),
    questionsPlayed: entry.user.forecasts.length,
    paidAt: entry.paidAt,
  }));

  return rankUsers(users);
}

export async function exportSeasonCSV(seasonId: string) {
  const rankings = await getSeasonRankings(seasonId);

  const headers = ["Rank", "Name", "Email", "Score", "Questions Played"];
  const rows = await Promise.all(
    rankings.map(async (user, index) => {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { email: true },
      });
      return [
        index + 1,
        user.name,
        dbUser?.email || "",
        (user.score * 100).toFixed(1) + "%",
        user.questionsPlayed,
      ].join(",");
    })
  );

  return [headers.join(","), ...rows].join("\n");
}

export async function finalizeSeason(seasonId: string) {
  await requireAdmin();
  await prisma.season.update({
    where: { id: seasonId },
    data: { status: "ENDED" },
  });
  return { success: true };
}
