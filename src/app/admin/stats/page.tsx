import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  MessageSquare,
  Target,
  Activity,
  UserX,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { QUESTION_STATUS_LABELS } from "@/lib/constants";

export default async function AdminStatsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "ADMIN") redirect("/");

  const admin = await createAdminClient();
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const [
    totalUsersResult,
    totalForecastsResult,
    totalCommentsResult,
    recentUsersResult,
    recentForecastsResult,
    recentCommentsResult,
    recentForecastersResult,
    questionsResult,
    forecastsResult,
    commentsResult,
    entriesResult,
    profilesResult,
  ] = await Promise.all([
    // Section 1: Overview counts
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("forecasts").select("*", { count: "exact", head: true }),
    admin.from("comments").select("*", { count: "exact", head: true }),
    // Section 2: Last 7 days counts
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    admin
      .from("forecasts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    admin
      .from("comments")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    // Section 2: Active users (need distinct user_ids)
    admin.from("forecasts").select("user_id").gte("created_at", sevenDaysAgo),
    // Section 3: All questions
    admin.from("questions").select("id, title, status, resolved_at"),
    // Forecasts for aggregation
    admin
      .from("forecasts")
      .select("user_id, question_id, probability, created_at"),
    // Comments for aggregation
    admin.from("comments").select("user_id, question_id, created_at"),
    // Section 5: Season entries
    admin
      .from("season_entries")
      .select("user_id")
      .in("status", ["PAID", "JOINED"]),
    // Profiles for names
    admin.from("profiles").select("id, name, display_name"),
  ]);

  // ── Section 1: Overview ──
  const totalUsers = totalUsersResult.count ?? 0;
  const totalForecasts = totalForecastsResult.count ?? 0;
  const totalComments = totalCommentsResult.count ?? 0;
  const avgForecasts =
    totalUsers > 0 ? (totalForecasts / totalUsers).toFixed(1) : "0";

  // ── Section 2: Last 7 Days ──
  const newSignups = recentUsersResult.count ?? 0;
  const recentForecasts = recentForecastsResult.count ?? 0;
  const recentComments = recentCommentsResult.count ?? 0;
  const activeUsers = new Set(
    recentForecastersResult.data?.map((f) => f.user_id)
  ).size;

  // ── Section 3: Market Engagement ──
  const questions = questionsResult.data ?? [];
  const forecasts = forecastsResult.data ?? [];
  const comments = commentsResult.data ?? [];

  const forecastsByQuestion = new Map<string, (typeof forecasts)[number][]>();
  for (const f of forecasts) {
    const arr = forecastsByQuestion.get(f.question_id) ?? [];
    arr.push(f);
    forecastsByQuestion.set(f.question_id, arr);
  }

  const commentCountByQuestion = new Map<string, number>();
  for (const c of comments) {
    commentCountByQuestion.set(
      c.question_id,
      (commentCountByQuestion.get(c.question_id) ?? 0) + 1
    );
  }

  const relevantQuestions = questions
    .filter(
      (q) =>
        q.status === "OPEN" ||
        q.status === "CLOSED" ||
        (q.status === "RESOLVED" &&
          q.resolved_at &&
          q.resolved_at >= thirtyDaysAgo)
    )
    .map((q) => {
      const qForecasts = forecastsByQuestion.get(q.id) ?? [];
      const avgProb =
        qForecasts.length > 0
          ? qForecasts.reduce((sum, f) => sum + f.probability, 0) /
            qForecasts.length
          : null;
      return {
        ...q,
        forecastCount: qForecasts.length,
        commentCount: commentCountByQuestion.get(q.id) ?? 0,
        consensus: avgProb,
      };
    })
    .sort((a, b) => b.forecastCount - a.forecastCount);

  // ── Section 4: Most Active Users ──
  const profiles = profilesResult.data ?? [];
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const forecastCountByUser = new Map<string, number>();
  const lastActivityByUser = new Map<string, string>();
  for (const f of forecasts) {
    forecastCountByUser.set(
      f.user_id,
      (forecastCountByUser.get(f.user_id) ?? 0) + 1
    );
    const current = lastActivityByUser.get(f.user_id);
    if (!current || f.created_at > current)
      lastActivityByUser.set(f.user_id, f.created_at);
  }

  const commentCountByUser = new Map<string, number>();
  for (const c of comments) {
    commentCountByUser.set(
      c.user_id,
      (commentCountByUser.get(c.user_id) ?? 0) + 1
    );
    const current = lastActivityByUser.get(c.user_id);
    if (!current || c.created_at > current)
      lastActivityByUser.set(c.user_id, c.created_at);
  }

  const topUsers = Array.from(forecastCountByUser.entries())
    .map(([userId, count]) => ({
      userId,
      name:
        profileMap.get(userId)?.display_name ||
        profileMap.get(userId)?.name ||
        "Unknown",
      forecastCount: count,
      commentCount: commentCountByUser.get(userId) ?? 0,
      lastActivity: lastActivityByUser.get(userId) ?? "",
    }))
    .sort((a, b) => b.forecastCount - a.forecastCount)
    .slice(0, 10);

  // ── Section 5: Disengaged Users ──
  const entryUserIds = new Set(
    entriesResult.data?.map((e) => e.user_id) ?? []
  );
  const openQuestionIds = new Set(
    questions.filter((q) => q.status === "OPEN").map((q) => q.id)
  );
  const usersWithOpenForecasts = new Set(
    forecasts
      .filter((f) => openQuestionIds.has(f.question_id))
      .map((f) => f.user_id)
  );
  const disengagedCount = Array.from(entryUserIds).filter(
    (id) => !usersWithOpenForecasts.has(id)
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          Engagement Stats
        </h1>
      </div>

      {/* Section 1: Overview */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="h-4 w-4" />}
            label="Total Users"
            value={totalUsers}
          />
          <StatCard
            icon={<Target className="h-4 w-4" />}
            label="Total Forecasts"
            value={totalForecasts}
          />
          <StatCard
            icon={<MessageSquare className="h-4 w-4" />}
            label="Total Comments"
            value={totalComments}
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Avg Forecasts/User"
            value={avgForecasts}
          />
        </div>
      </section>

      {/* Section 2: Last 7 Days */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Last 7 Days</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="New Signups" value={newSignups} highlight />
          <StatCard label="Forecasts" value={recentForecasts} highlight />
          <StatCard label="Comments" value={recentComments} highlight />
          <StatCard
            icon={<Activity className="h-4 w-4" />}
            label="Active Users"
            value={activeUsers}
            highlight
          />
        </div>
      </section>

      {/* Section 3: Market Engagement */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Market Engagement</h2>
        <Card>
          <CardContent className="pt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Forecasts</TableHead>
                  <TableHead className="text-right">Comments</TableHead>
                  <TableHead className="text-right">Consensus</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relevantQuestions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground"
                    >
                      No active questions
                    </TableCell>
                  </TableRow>
                ) : (
                  relevantQuestions.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="max-w-[300px] truncate font-medium">
                        {q.title}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            q.status === "OPEN" ? "default" : "secondary"
                          }
                        >
                          {QUESTION_STATUS_LABELS[q.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {q.forecastCount}
                      </TableCell>
                      <TableCell className="text-right">
                        {q.commentCount}
                      </TableCell>
                      <TableCell className="text-right">
                        {q.consensus !== null
                          ? `${(q.consensus * 100).toFixed(0)}%`
                          : "\u2014"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Section 4: Most Active Users */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Most Active Users</h2>
        <Card>
          <CardContent className="pt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Forecasts</TableHead>
                  <TableHead className="text-right">Comments</TableHead>
                  <TableHead className="text-right">Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      No activity yet
                    </TableCell>
                  </TableRow>
                ) : (
                  topUsers.map((u) => (
                    <TableRow key={u.userId}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-right">
                        {u.forecastCount}
                      </TableCell>
                      <TableCell className="text-right">
                        {u.commentCount}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {u.lastActivity
                          ? formatDateTime(u.lastActivity)
                          : "\u2014"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Section 5: Disengaged Users */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Disengaged Users</h2>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <UserX className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{disengagedCount}</p>
                <p className="text-sm text-muted-foreground">
                  Season participants with 0 forecasts on open questions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <div
          className={`text-2xl font-bold mt-1 ${highlight ? "text-emerald-500" : ""}`}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
