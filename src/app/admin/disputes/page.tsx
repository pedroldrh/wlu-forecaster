import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { DisputeActions } from "./dispute-actions";
import Link from "next/link";

export default async function AdminDisputesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") redirect("/");

  const { data: disputes } = await supabase
    .from("resolution_disputes")
    .select("*, profiles:user_id(name, display_name, email), questions:question_id(title)")
    .order("created_at", { ascending: false });

  const pending = (disputes ?? []).filter((d: any) => d.status === "PENDING");
  const handled = (disputes ?? []).filter((d: any) => d.status !== "PENDING");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resolution Disputes</h1>
        <p className="text-muted-foreground">{pending.length} pending</p>
      </div>

      {pending.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No pending disputes.</p>
      ) : (
        <div className="space-y-3">
          {pending.map((d: any) => {
            const p = d.profiles as { name: string | null; display_name: string | null; email: string } | null;
            const q = d.questions as { title: string } | null;
            const userName = p?.display_name || p?.name || p?.email || "Unknown";
            return (
              <Card key={d.id}>
                <CardContent className="pt-4 space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="default">Pending</Badge>
                    </div>
                    <Link href={`/questions/${d.question_id}`} className="font-medium hover:underline block">
                      {q?.title || "Unknown question"}
                    </Link>
                    <p className="text-sm text-muted-foreground">{d.message}</p>
                    <p className="text-xs text-muted-foreground">
                      By {userName} · {formatDateTime(d.created_at)}
                    </p>
                  </div>
                  <DisputeActions disputeId={d.id} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {handled.length > 0 && (
        <>
          <h2 className="font-semibold text-lg pt-4">Previously Reviewed</h2>
          <div className="space-y-3">
            {handled.map((d: any) => {
              const p = d.profiles as { name: string | null; display_name: string | null; email: string } | null;
              const q = d.questions as { title: string } | null;
              const userName = p?.display_name || p?.name || p?.email || "Unknown";
              return (
                <Card key={d.id} className="opacity-60">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={d.status === "REVIEWED" ? "default" : "secondary"}>
                        {d.status === "REVIEWED" ? "Acknowledged" : "Dismissed"}
                      </Badge>
                    </div>
                    <Link href={`/questions/${d.question_id}`} className="font-medium mt-1 hover:underline block">
                      {q?.title || "Unknown question"}
                    </Link>
                    <p className="text-sm text-muted-foreground">{d.message}</p>
                    <p className="text-xs text-muted-foreground">
                      By {userName} · {formatDateTime(d.created_at)}
                      {d.admin_note && ` · Note: ${d.admin_note}`}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
