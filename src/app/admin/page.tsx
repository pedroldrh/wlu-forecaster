import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, HelpCircle, Calendar, DollarSign } from "lucide-react";

export default async function AdminPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/");

  const [userCount, paidEntries, openQuestions, seasons] = await Promise.all([
    prisma.user.count(),
    prisma.seasonEntry.count({ where: { status: "PAID" } }),
    prisma.question.count({ where: { status: "OPEN" } }),
    prisma.season.count(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Users</span>
            </div>
            <div className="text-2xl font-bold mt-1">{userCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Paid Entries</span>
            </div>
            <div className="text-2xl font-bold mt-1">{paidEntries}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Open Questions</span>
            </div>
            <div className="text-2xl font-bold mt-1">{openQuestions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Seasons</span>
            </div>
            <div className="text-2xl font-bold mt-1">{seasons}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Seasons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/admin/seasons">Manage Seasons</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/seasons/new">Create Season</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/admin/questions">Manage Questions</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/questions/new">Create Question</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
