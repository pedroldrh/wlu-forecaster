import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalibrationChart } from "@/components/calibration-chart";
import { seasonScore, brierPoints } from "@/lib/scoring";
import { formatPercent, formatDate } from "@/lib/utils";
import { User, Trophy, Target, Flame } from "lucide-react";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch the profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  // Get season entries
  const { data: entriesRaw } = await supabase
    .from("season_entries")
    .select("*, seasons(*)")
    .eq("user_id", id)
    .eq("status", "PAID");

  const entries = entriesRaw ?? [];

  // Get current/latest season
  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .in("status", ["LIVE", "ENDED"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let score = 0;
  let questionsPlayed = 0;
  let resolvedForecasts: { probability: number; outcome: boolean; title: string; points: number }[] = [];
  let calibrationData: { probability: number; outcome: boolean }[] = [];

  if (season) {
    // Get resolved question IDs for this season
    const { data: resolvedQuestions } = await supabase
      .from("questions")
      .select("id, title, resolved_outcome")
      .eq("season_id", season.id)
      .eq("status", "RESOLVED");

    const resolvedQs = resolvedQuestions ?? [];
    const resolvedQuestionIds = resolvedQs.map((q) => q.id);

    // Get forecasts for this user on resolved questions
    if (resolvedQuestionIds.length > 0) {
      const { data: forecasts } = await supabase
        .from("forecasts")
        .select("id, probability, question_id, submitted_at")
        .eq("user_id", id)
        .in("question_id", resolvedQuestionIds)
        .order("submitted_at", { ascending: false });

      const questionMap = new Map(resolvedQs.map((q) => [q.id, q]));

      const forCalc = (forecasts ?? []).map((f) => {
        const q = questionMap.get(f.question_id)!;
        return {
          probability: f.probability,
          outcome: q.resolved_outcome as boolean,
        };
      });

      score = seasonScore(forCalc);
      questionsPlayed = (forecasts ?? []).length;
      calibrationData = forCalc;

      resolvedForecasts = (forecasts ?? []).map((f) => {
        const q = questionMap.get(f.question_id)!;
        return {
          probability: f.probability,
          outcome: q.resolved_outcome as boolean,
          title: q.title,
          points: brierPoints(f.probability, q.resolved_outcome as boolean),
        };
      });
    }
  }

  // Get all forecasts including unresolved for this season
  let allForecasts: { id: string; probability: number; question_id: string; submitted_at: string; question: { title: string; status: string; resolved_outcome: boolean | null } }[] = [];
  if (season) {
    // Get all question IDs for this season
    const { data: allQuestions } = await supabase
      .from("questions")
      .select("id, title, status, resolved_outcome")
      .eq("season_id", season.id);

    const allQs = allQuestions ?? [];
    const allQuestionIds = allQs.map((q) => q.id);

    if (allQuestionIds.length > 0) {
      const { data: forecasts } = await supabase
        .from("forecasts")
        .select("id, probability, question_id, submitted_at")
        .eq("user_id", id)
        .in("question_id", allQuestionIds)
        .order("submitted_at", { ascending: false });

      const questionMap = new Map(allQs.map((q) => [q.id, q]));
      allForecasts = (forecasts ?? []).map((f) => {
        const q = questionMap.get(f.question_id)!;
        return {
          ...f,
          question: {
            title: q.title,
            status: q.status,
            resolved_outcome: q.resolved_outcome,
          },
        };
      });
    }
  }

  // Badges
  const badges: string[] = [];
  if (profile.is_wlu_verified) badges.push("W&L Verified");

  // Check total resolved questions in season
  if (season) {
    const { count: totalResolved } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("season_id", season.id)
      .eq("status", "RESOLVED");

    if (totalResolved && totalResolved > 0 && questionsPlayed >= totalResolved * 0.9) {
      badges.push("Most Active");
    }
  }

  const isOwnProfile = user?.id === id;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-full" />
        ) : (
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{profile.name || "Anonymous"}</h1>
          <p className="text-sm text-muted-foreground">
            Joined {formatDate(new Date(profile.created_at))}
          </p>
          <div className="flex gap-2 mt-1">
            {badges.map((b) => (
              <Badge key={b} variant="outline">{b}</Badge>
            ))}
          </div>
        </div>
      </div>

      {season && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold font-mono">
                {formatPercent(score)}
              </div>
              <p className="text-xs text-muted-foreground">Avg Score</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold">{questionsPlayed}</div>
              <p className="text-xs text-muted-foreground">Questions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold">{allForecasts.length}</div>
              <p className="text-xs text-muted-foreground">Total Forecasts</p>
            </CardContent>
          </Card>
        </div>
      )}

      {calibrationData.length >= 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Calibration</CardTitle>
          </CardHeader>
          <CardContent>
            <CalibrationChart forecasts={calibrationData} />
          </CardContent>
        </Card>
      )}

      {allForecasts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Forecasts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allForecasts.slice(0, 20).map((f) => (
                <div key={f.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.question.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {f.question.status === "RESOLVED"
                        ? `Resolved ${f.question.resolved_outcome ? "YES" : "NO"}`
                        : f.question.status}
                    </p>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <div className="font-mono text-sm">{Math.round(f.probability * 100)}%</div>
                    {f.question.status === "RESOLVED" && (
                      <div className="text-xs font-mono text-muted-foreground">
                        {(brierPoints(f.probability, f.question.resolved_outcome!) * 100).toFixed(1)} pts
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
