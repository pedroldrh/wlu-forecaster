import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents, formatDate } from "@/lib/utils";
import { CheckCircle, Trophy, BarChart3, Users } from "lucide-react";
import { JoinButton } from "./join-button";

export default async function JoinPage({ params }: { params: Promise<{ seasonId: string }> }) {
  const { seasonId } = await params;
  const session = await auth();
  if (!session) redirect("/signin");

  const season = await prisma.season.findUnique({ where: { id: seasonId } });
  if (!season || season.status !== "LIVE") redirect("/");

  // Check if already paid
  const existing = await prisma.seasonEntry.findUnique({
    where: { userId_seasonId: { userId: session.user.id, seasonId } },
  });
  if (existing?.status === "PAID") redirect("/");

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{season.name}</CardTitle>
          <CardDescription>
            {formatDate(season.startDate)} — {formatDate(season.endDate)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold">{formatCents(season.entryFeeCents)}</div>
            <p className="text-sm text-muted-foreground mt-1">One-time entry fee</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <BarChart3 className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">Make Predictions</p>
                <p className="text-sm text-muted-foreground">Submit probability forecasts on campus questions</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Trophy className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">Compete on Leaderboard</p>
                <p className="text-sm text-muted-foreground">Get scored with Brier scoring — accuracy matters</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">Win Prizes</p>
                <p className="text-sm text-muted-foreground">Top forecasters split the prize pool at season end</p>
              </div>
            </div>
          </div>

          {!session.user.isWluVerified ? (
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">
                Your GitHub account must be linked to a @mail.wlu.edu email to participate.
              </p>
            </div>
          ) : (
            <JoinButton seasonId={seasonId} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
