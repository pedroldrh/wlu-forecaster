import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatDollars } from "@/lib/utils";
import { Trophy, BarChart3, Users, ShieldCheck } from "lucide-react";
import { JoinButton } from "./join-button";

export default async function JoinPage({ params }: { params: Promise<{ seasonId: string }> }) {
  const { seasonId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

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

  // Check if already joined
  const { data: existing } = await supabase
    .from("season_entries")
    .select("*")
    .eq("user_id", user.id)
    .eq("season_id", seasonId)
    .single();

  if (existing?.status === "PAID" || existing?.status === "JOINED") redirect("/");

  const totalPrize = season.prize_1st_cents + season.prize_2nd_cents + season.prize_3rd_cents + season.prize_bonus_cents;

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
            <div className="text-4xl font-bold text-green-600">FREE</div>
            <p className="text-sm text-muted-foreground mt-1">
              Prize Pool: {formatDollars(totalPrize)}
            </p>
          </div>

          <div className="border rounded-lg p-4 space-y-2">
            <p className="font-semibold text-sm">Prize Breakdown</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">1st Place</span>
              <span className="font-mono text-right">{formatDollars(season.prize_1st_cents)}</span>
              <span className="text-muted-foreground">2nd Place</span>
              <span className="font-mono text-right">{formatDollars(season.prize_2nd_cents)}</span>
              <span className="text-muted-foreground">3rd Place</span>
              <span className="font-mono text-right">{formatDollars(season.prize_3rd_cents)}</span>
              <span className="text-muted-foreground">Bonus Prize</span>
              <span className="font-mono text-right">{formatDollars(season.prize_bonus_cents)}</span>
            </div>
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
              <ShieldCheck className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">Participation Required</p>
                <p className="text-sm text-muted-foreground">
                  Forecast on at least {season.min_participation_pct}% of questions to qualify for prizes
                </p>
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
