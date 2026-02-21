import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import { RequestActions } from "./request-actions";

export default async function AdminRequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") redirect("/");

  const { data: requests } = await supabase
    .from("question_requests")
    .select("*, profiles:user_id(name, display_name, email)")
    .order("created_at", { ascending: false });

  // Get the live season for approve action
  const { data: season } = await supabase
    .from("seasons")
    .select("id, name")
    .eq("status", "LIVE")
    .single();

  const pending = (requests ?? []).filter((r) => r.status === "PENDING");
  const handled = (requests ?? []).filter((r) => r.status !== "PENDING");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Question Requests</h1>
        <p className="text-muted-foreground">{pending.length} pending</p>
      </div>

      {pending.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No pending requests.</p>
      ) : (
        <div className="space-y-3">
          {pending.map((r) => {
            const p = r.profiles as unknown as { name: string | null; display_name: string | null; email: string };
            const userName = p?.display_name || p?.name || p?.email || "Unknown";
            return (
              <Card key={r.id}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">{CATEGORY_LABELS[r.category] || r.category}</Badge>
                        <Badge variant="default">Pending</Badge>
                      </div>
                      <p className="font-medium">{r.title}</p>
                      {r.description && (
                        <p className="text-sm text-muted-foreground">{r.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Suggested by {userName} · {formatDateTime(r.created_at)}
                      </p>
                    </div>
                  </div>
                  <RequestActions
                    requestId={r.id}
                    seasonId={season?.id ?? null}
                    seasonName={season?.name ?? null}
                  />
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
            {handled.map((r) => {
              const p = r.profiles as unknown as { name: string | null; display_name: string | null; email: string };
              const userName = p?.display_name || p?.name || p?.email || "Unknown";
              return (
                <Card key={r.id} className="opacity-60">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{CATEGORY_LABELS[r.category] || r.category}</Badge>
                      <Badge variant={r.status === "APPROVED" ? "default" : "secondary"}>
                        {r.status === "APPROVED" ? "Approved" : "Denied"}
                      </Badge>
                    </div>
                    <p className="font-medium mt-1">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      By {userName} · {formatDateTime(r.created_at)}
                      {r.admin_note && ` · Note: ${r.admin_note}`}
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
