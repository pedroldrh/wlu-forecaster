import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QuestionCard } from "@/components/question-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function QuestionsPage() {
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

  const questions = await prisma.question.findMany({
    where: { seasonId: season.id },
    orderBy: { closeTime: "asc" },
    include: {
      _count: { select: { forecasts: true } },
      forecasts: session?.user?.id
        ? { where: { userId: session.user.id }, select: { probability: true } }
        : false,
    },
  });

  const open = questions.filter((q) => q.status === "OPEN");
  const closed = questions.filter((q) => q.status === "CLOSED");
  const resolved = questions.filter((q) => q.status === "RESOLVED");

  const renderQuestions = (qs: typeof questions) => {
    if (qs.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-8">
          No questions in this category.
        </p>
      );
    }
    return (
      <div className="space-y-3">
        {qs.map((q) => (
          <QuestionCard
            key={q.id}
            id={q.id}
            title={q.title}
            category={q.category}
            status={q.status}
            closeTime={q.closeTime}
            forecastCount={q._count.forecasts}
            resolvedOutcome={q.resolvedOutcome}
            userProbability={
              Array.isArray(q.forecasts) && q.forecasts.length > 0
                ? q.forecasts[0].probability
                : null
            }
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Questions</h1>
        <p className="text-muted-foreground">{season.name}</p>
      </div>

      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">Open ({open.length})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({closed.length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({resolved.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="open" className="mt-4">
          {renderQuestions(open)}
        </TabsContent>
        <TabsContent value="closed" className="mt-4">
          {renderQuestions(closed)}
        </TabsContent>
        <TabsContent value="resolved" className="mt-4">
          {renderQuestions(resolved)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
