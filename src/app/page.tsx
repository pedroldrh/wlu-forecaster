import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SeasonBanner } from "@/components/season-banner";
import { QuestionCard } from "@/components/question-card";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { seasonScore, rankUsers, UserScore } from "@/lib/scoring";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();

  // Get current live season
  const season = await prisma.season.findFirst({
    where: { status: "LIVE" },
    include: {
      _count: { select: { entries: { where: { status: "PAID" } } } },
    },
  });

  // Check if user has paid entry
  let isPaid = false;
  if (session?.user?.id && season) {
    const entry = await prisma.seasonEntry.findUnique({
      where: {
        userId_seasonId: {
          userId: session.user.id,
          seasonId: season.id,
        },
      },
    });
    isPaid = entry?.status === "PAID";
  }

  // Get upcoming questions (next 3 closing)
  const upcomingQuestions = season
    ? await prisma.question.findMany({
        where: {
          seasonId: season.id,
          status: "OPEN",
          closeTime: { gt: new Date() },
        },
        orderBy: { closeTime: "asc" },
        take: 3,
        include: {
          _count: { select: { forecasts: true } },
          forecasts: session?.user?.id
            ? { where: { userId: session.user.id }, select: { probability: true } }
            : false,
        },
      })
    : [];

  // Get top 5 for leaderboard snippet
  let leaderboardEntries: { rank: number; userId: string; name: string; image?: string | null; score: number; questionsPlayed: number; isCurrentUser?: boolean }[] = [];
  if (season) {
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
    leaderboardEntries = ranked.slice(0, 5).map((u, i) => ({
      rank: i + 1,
      userId: u.userId,
      name: u.name,
      image: entries.find((e) => e.userId === u.userId)?.user.image,
      score: u.score,
      questionsPlayed: u.questionsPlayed,
      isCurrentUser: u.userId === session?.user?.id,
    }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Forecaster</h1>
        <p className="text-muted-foreground">
          W&L Campus Forecasting Tournament
        </p>
      </div>

      {season ? (
        <SeasonBanner
          id={season.id}
          name={season.name}
          startDate={season.startDate}
          endDate={season.endDate}
          entryFeeCents={season.entryFeeCents}
          status={season.status}
          isPaid={isPaid}
          isAuthenticated={!!session}
        />
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No active season right now. Check back soon!
          </CardContent>
        </Card>
      )}

      {upcomingQuestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Upcoming Deadlines</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/questions">View all</Link>
            </Button>
          </div>
          {upcomingQuestions.map((q) => (
            <QuestionCard
              key={q.id}
              id={q.id}
              title={q.title}
              category={q.category}
              status={q.status}
              closeTime={q.closeTime}
              forecastCount={q._count.forecasts}
              userProbability={
                Array.isArray(q.forecasts) && q.forecasts.length > 0
                  ? q.forecasts[0].probability
                  : null
              }
            />
          ))}
        </div>
      )}

      {leaderboardEntries.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Leaderboard</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/leaderboard">Full leaderboard</Link>
            </Button>
          </div>
          <Card>
            <CardContent className="pt-4">
              <LeaderboardTable entries={leaderboardEntries} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
