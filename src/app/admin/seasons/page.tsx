import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEASON_STATUS_LABELS } from "@/lib/constants";
import { formatDate, formatCents } from "@/lib/utils";
import Link from "next/link";

export default async function AdminSeasonsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/");

  const seasons = await prisma.season.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { entries: { where: { status: "PAID" } }, questions: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Seasons</h1>
        <Button asChild>
          <Link href="/admin/seasons/new">Create Season</Link>
        </Button>
      </div>

      {seasons.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No seasons yet.</p>
      ) : (
        <div className="space-y-3">
          {seasons.map((s) => (
            <Card key={s.id}>
              <CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{s.name}</span>
                    <Badge variant={s.status === "LIVE" ? "default" : "secondary"}>
                      {SEASON_STATUS_LABELS[s.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(s.startDate)} — {formatDate(s.endDate)} · {formatCents(s.entryFeeCents)} · {s._count.entries} entries · {s._count.questions} questions
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/seasons/${s.id}/edit`}>Edit</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/export/${s.id}`}>Export</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
