import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CountdownTimer } from "@/components/countdown-timer";
import { CATEGORY_LABELS } from "@/lib/constants";
import { ForecastForm } from "./forecast-form";
import { Users, CheckCircle, XCircle } from "lucide-react";
import { brierPoints } from "@/lib/scoring";

export default async function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const question = await prisma.question.findUnique({
    where: { id },
    include: {
      season: true,
      _count: { select: { forecasts: true } },
      forecasts: true,
    },
  });

  if (!question) notFound();

  // Check if user has paid entry
  let isPaid = false;
  let userForecast = null;
  if (session?.user?.id) {
    const entry = await prisma.seasonEntry.findUnique({
      where: {
        userId_seasonId: {
          userId: session.user.id,
          seasonId: question.seasonId,
        },
      },
    });
    isPaid = entry?.status === "PAID";

    userForecast = await prisma.forecast.findUnique({
      where: {
        userId_questionId: {
          userId: session.user.id,
          questionId: id,
        },
      },
    });
  }

  const isOpen = question.status === "OPEN" && new Date() < question.closeTime;
  const consensus = question.forecasts.length > 0
    ? question.forecasts.reduce((sum, f) => sum + f.probability, 0) / question.forecasts.length
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline">
            {CATEGORY_LABELS[question.category] || question.category}
          </Badge>
          {question.status === "RESOLVED" && (
            <Badge variant={question.resolvedOutcome ? "default" : "secondary"}>
              {question.resolvedOutcome ? "Resolved YES" : "Resolved NO"}
            </Badge>
          )}
          {question.status === "CLOSED" && (
            <Badge variant="secondary">Awaiting Resolution</Badge>
          )}
          {isOpen && <Badge variant="default">Open</Badge>}
        </div>
        <h1 className="text-2xl font-bold">{question.title}</h1>
        <p className="text-muted-foreground">{question.description}</p>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          {question._count.forecasts} forecast{question._count.forecasts !== 1 ? "s" : ""}
        </span>
        {isOpen && <CountdownTimer targetDate={question.closeTime} />}
      </div>

      <Separator />

      {/* Forecast submission */}
      {isOpen && session && isPaid && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <ForecastForm
              questionId={id}
              currentProbability={userForecast?.probability ?? null}
            />
          </CardContent>
        </Card>
      )}

      {isOpen && session && !isPaid && (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            You need a paid season entry to submit forecasts.
          </CardContent>
        </Card>
      )}

      {isOpen && !session && (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            Sign in to submit a forecast.
          </CardContent>
        </Card>
      )}

      {/* Resolved: show outcome + user score */}
      {question.status === "RESOLVED" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {question.resolvedOutcome ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Resolved: {question.resolvedOutcome ? "YES" : "NO"}
            </CardTitle>
          </CardHeader>
          {userForecast && (
            <CardContent>
              <div className="flex justify-between items-center">
                <span>Your forecast: {Math.round(userForecast.probability * 100)}%</span>
                <span className="font-mono font-bold">
                  {(brierPoints(userForecast.probability, question.resolvedOutcome!) * 100).toFixed(1)} pts
                </span>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Consensus (shown after close) */}
      {question.status !== "OPEN" && consensus !== null && (
        <Card>
          <CardContent className="py-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Community consensus</span>
              <span className="font-mono font-bold">{Math.round(consensus * 100)}%</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
