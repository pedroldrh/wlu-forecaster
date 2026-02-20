import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { ExportActions } from "./export-actions";
import { seasonScore, rankUsers, UserScore } from "@/lib/scoring";

export default async function ExportPage({ params }: { params: Promise<{ seasonId: string }> }) {
  const { seasonId } = await params;
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/");

  const season = await prisma.season.findUnique({
    where: { id: seasonId },
  });
  if (!season) notFound();

  const entries = await prisma.seasonEntry.findMany({
    where: { seasonId, status: "PAID" },
    include: {
      user: {
        include: {
          forecasts: {
            where: {
              question: { seasonId, status: "RESOLVED" },
            },
            include: { question: true },
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

  const ranked = rankUsers(users);

  const leaderboardEntries = ranked.map((u, i) => ({
    rank: i + 1,
    userId: u.userId,
    name: u.name,
    image: entries.find((e) => e.userId === u.userId)?.user.image,
    score: u.score,
    questionsPlayed: u.questionsPlayed,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Export — {season.name}</h1>
        <p className="text-muted-foreground">
          {entries.length} paid entries · Status: {season.status}
        </p>
      </div>

      <ExportActions seasonId={seasonId} status={season.status} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Final Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <LeaderboardTable entries={leaderboardEntries} />
        </CardContent>
      </Card>
    </div>
  );
}
