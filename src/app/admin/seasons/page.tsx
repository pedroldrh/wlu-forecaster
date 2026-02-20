import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEASON_STATUS_LABELS } from "@/lib/constants";
import { formatDate, formatDollars } from "@/lib/utils";
import Link from "next/link";

export default async function AdminSeasonsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") redirect("/");

  const { data: seasons } = await supabase
    .from("seasons")
    .select("*")
    .order("created_at", { ascending: false });

  const seasonIds = (seasons ?? []).map((s) => s.id);

  const [entryCounts, questionCounts] = await Promise.all([
    Promise.all(
      seasonIds.map((id) =>
        supabase
          .from("season_entries")
          .select("*", { count: "exact", head: true })
          .eq("season_id", id)
          .in("status", ["PAID", "JOINED"])
          .then((res) => ({ id, count: res.count ?? 0 }))
      )
    ),
    Promise.all(
      seasonIds.map((id) =>
        supabase
          .from("questions")
          .select("*", { count: "exact", head: true })
          .eq("season_id", id)
          .then((res) => ({ id, count: res.count ?? 0 }))
      )
    ),
  ]);

  const entryCountMap = Object.fromEntries(entryCounts.map((e) => [e.id, e.count]));
  const questionCountMap = Object.fromEntries(questionCounts.map((q) => [q.id, q.count]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Seasons</h1>
        <Button asChild>
          <Link href="/admin/seasons/new">Create Season</Link>
        </Button>
      </div>

      {(seasons ?? []).length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No seasons yet.</p>
      ) : (
        <div className="space-y-3">
          {(seasons ?? []).map((s) => {
            const totalPrize = s.prize_1st_cents + s.prize_2nd_cents + s.prize_3rd_cents + s.prize_bonus_cents;
            return (
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
                      {formatDate(s.start_date)} — {formatDate(s.end_date)} · Prize: {formatDollars(totalPrize)} · {entryCountMap[s.id] ?? 0} participants · {questionCountMap[s.id] ?? 0} questions
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
            );
          })}
        </div>
      )}
    </div>
  );
}
