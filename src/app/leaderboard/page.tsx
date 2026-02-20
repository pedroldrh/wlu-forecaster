import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { seasonScore, rankUsers, UserScore } from "@/lib/scoring";

export default async function LeaderboardPage() {
  const session = await auth();

  const season = await prisma.season.findFirst({
    where: { status: { in: ["LIVE", "ENDED"] } },
    orderBy: { createdAt: "desc" },
  });

  if (!season) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No active season found.
      </div>
    );
  }

  const entries = await prisma.seasonEntry.findMany({
    where: { seasonId: season.id, status: "PAID" },
    include: {
      user: {
        include: {
          forecasts: {
            where: {
              question: { seasonId: season.id, status: "RESOLVED" },
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
    isCurrentUser: u.userId === session?.user?.id,
  }));

  // Count resolved questions
  const resolvedCount = await prisma.question.count({
    where: { seasonId: season.id, status: "RESOLVED" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground">
          {season.name} — {resolvedCount} question{resolvedCount !== 1 ? "s" : ""} resolved
        </p>
      </div>

      <Card>
        <CardContent className="pt-4">
          <LeaderboardTable entries={leaderboardEntries} />
        </CardContent>
      </Card>
    </div>
  );
}
