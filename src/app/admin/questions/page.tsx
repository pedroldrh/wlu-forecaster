import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABELS, QUESTION_STATUS_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";

export default async function AdminQuestionsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/");

  const questions = await prisma.question.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      season: { select: { name: true } },
      _count: { select: { forecasts: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Questions</h1>
        <Button asChild>
          <Link href="/admin/questions/new">Create Question</Link>
        </Button>
      </div>

      {questions.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No questions yet.</p>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <Card key={q.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{CATEGORY_LABELS[q.category]}</Badge>
                      <Badge variant={q.status === "OPEN" ? "default" : "secondary"}>
                        {QUESTION_STATUS_LABELS[q.status]}
                      </Badge>
                      {q.resolvedOutcome !== null && (
                        <Badge>{q.resolvedOutcome ? "YES" : "NO"}</Badge>
                      )}
                    </div>
                    <p className="font-medium">{q.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {q.season.name} · {q._count.forecasts} forecasts · Closes {formatDateTime(q.closeTime)}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/questions/${q.id}/edit`}>Edit</Link>
                    </Button>
                    {q.status !== "RESOLVED" && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/questions/${q.id}/resolve`}>Resolve</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
