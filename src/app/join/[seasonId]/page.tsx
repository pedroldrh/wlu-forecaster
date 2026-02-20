import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents, formatDate } from "@/lib/utils";
import { CheckCircle, Trophy, BarChart3, Users } from "lucide-react";
import { JoinButton } from "./join-button";

export default async function JoinPage({ params }: { params: Promise<{ seasonId: string }> }) {
  const { seasonId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  // Get profile for is_wlu_verified check
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .eq("id", seasonId)
    .single();

  if (!season || season.status !== "LIVE") redirect("/");

  // Check if already paid
  const { data: existing } = await supabase
    .from("season_entries")
    .select("*")
    .eq("user_id", user.id)
    .eq("season_id", seasonId)
    .single();

  if (existing?.status === "PAID") redirect("/");

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{season.name}</CardTitle>
          <CardDescription>
            {formatDate(new Date(season.start_date))} — {formatDate(new Date(season.end_date))}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold">{formatCents(season.entry_fee_cents)}</div>
            <p className="text-sm text-muted-foreground mt-1">One-time entry fee</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <BarChart3 className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">Make Predictions</p>
                <p className="text-sm text-muted-foreground">Submit probability forecasts on campus questions</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Trophy className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">Compete on Leaderboard</p>
                <p className="text-sm text-muted-foreground">Get scored with Brier scoring — accuracy matters</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">Win Prizes</p>
                <p className="text-sm text-muted-foreground">Top forecasters split the prize pool at season end</p>
              </div>
            </div>
          </div>

          {!profile?.is_wlu_verified ? (
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">
                You must sign in with a @mail.wlu.edu email to participate.
              </p>
            </div>
          ) : (
            <JoinButton seasonId={seasonId} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
