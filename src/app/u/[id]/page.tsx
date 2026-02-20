import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalibrationChart } from "@/components/calibration-chart";
import { seasonScore, brierPoints } from "@/lib/scoring";
import { formatPercent, formatDate } from "@/lib/utils";
import { User, Trophy, Target, Flame } from "lucide-react";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      entries: {
        include: { season: true },
        where: { status: "PAID" },
      },
    },
  });

  if (!user) notFound();

  // Get current/latest season
  const season = await prisma.season.findFirst({
    where: { status: { in: ["LIVE", "ENDED"] } },
    orderBy: { createdAt: "desc" },
  });

  let score = 0;
  let questionsPlayed = 0;
  let resolvedForecasts: { probability: number; outcome: boolean; title: string; points: number }[] = [];
  let calibrationData: { probability: number; outcome: boolean }[] = [];

  if (season) {
    const forecasts = await prisma.forecast.findMany({
      where: {
        userId: id,
        question: { seasonId: season.id, status: "RESOLVED" },
      },
      include: { question: true },
      orderBy: { submittedAt: "desc" },
    });

    const forCalc = forecasts.map((f) => ({
      probability: f.probability,
      outcome: f.question.resolvedOutcome!,
    }));

    score = seasonScore(forCalc);
    questionsPlayed = forecasts.length;
    calibrationData = forCalc;

    resolvedForecasts = forecasts.map((f) => ({
      probability: f.probability,
      outcome: f.question.resolvedOutcome!,
      title: f.question.title,
      points: brierPoints(f.probability, f.question.resolvedOutcome!),
    }));
  }

  // Get all forecasts including unresolved
  const allForecasts = season
    ? await prisma.forecast.findMany({
        where: { userId: id, question: { seasonId: season.id } },
        include: { question: true },
        orderBy: { submittedAt: "desc" },
      })
    : [];

  // Badges
  const badges: string[] = [];
  if (user.isWluVerified) badges.push("W&L Verified");

  // Check total resolved questions in season
  if (season) {
    const totalResolved = await prisma.question.count({
      where: { seasonId: season.id, status: "RESOLVED" },
    });
    if (totalResolved > 0 && questionsPlayed >= totalResolved * 0.9) {
      badges.push("Most Active");
    }
  }

  const isOwnProfile = session?.user?.id === id;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        {user.image ? (
          <img src={user.image} alt="" className="h-16 w-16 rounded-full" />
        ) : (
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{user.name || "Anonymous"}</h1>
          <p className="text-sm text-muted-foreground">
            Joined {formatDate(user.createdAt)}
          </p>
          <div className="flex gap-2 mt-1">
            {badges.map((b) => (
              <Badge key={b} variant="outline">{b}</Badge>
            ))}
          </div>
        </div>
      </div>

      {season && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold font-mono">
                {formatPercent(score)}
              </div>
              <p className="text-xs text-muted-foreground">Avg Score</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold">{questionsPlayed}</div>
              <p className="text-xs text-muted-foreground">Questions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold">{allForecasts.length}</div>
              <p className="text-xs text-muted-foreground">Total Forecasts</p>
            </CardContent>
          </Card>
        </div>
      )}

      {calibrationData.length >= 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Calibration</CardTitle>
          </CardHeader>
          <CardContent>
            <CalibrationChart forecasts={calibrationData} />
          </CardContent>
        </Card>
      )}

      {allForecasts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Forecasts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allForecasts.slice(0, 20).map((f) => (
                <div key={f.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.question.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {f.question.status === "RESOLVED"
                        ? `Resolved ${f.question.resolvedOutcome ? "YES" : "NO"}`
                        : f.question.status}
                    </p>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <div className="font-mono text-sm">{Math.round(f.probability * 100)}%</div>
                    {f.question.status === "RESOLVED" && (
                      <div className="text-xs font-mono text-muted-foreground">
                        {(brierPoints(f.probability, f.question.resolvedOutcome!) * 100).toFixed(1)} pts
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
