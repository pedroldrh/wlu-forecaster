import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, HelpCircle, Calendar, Trophy, Lightbulb, AlertTriangle } from "lucide-react";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") redirect("/");

  const [userResult, participantResult, openResult, seasonResult, requestResult, disputeResult] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("season_entries").select("*", { count: "exact", head: true }).in("status", ["PAID", "JOINED"]),
    supabase.from("questions").select("*", { count: "exact", head: true }).eq("status", "OPEN"),
    supabase.from("seasons").select("*", { count: "exact", head: true }),
    supabase.from("question_requests").select("*", { count: "exact", head: true }).eq("status", "PENDING"),
    supabase.from("resolution_disputes").select("*", { count: "exact", head: true }).eq("status", "PENDING"),
  ]);

  const userCount = userResult.count ?? 0;
  const participants = participantResult.count ?? 0;
  const openQuestions = openResult.count ?? 0;
  const seasons = seasonResult.count ?? 0;
  const pendingRequests = requestResult.count ?? 0;
  const pendingDisputes = disputeResult.count ?? 0;

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
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Participants</span>
            </div>
            <div className="text-2xl font-bold mt-1">{participants}</div>
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Question Requests
              {pendingRequests > 0 && (
                <span className="text-sm font-normal text-muted-foreground">({pendingRequests} pending)</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/requests">Review Requests</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Resolution Disputes
              {pendingDisputes > 0 && (
                <span className="text-sm font-normal text-muted-foreground">({pendingDisputes} pending)</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/disputes">Review Disputes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
