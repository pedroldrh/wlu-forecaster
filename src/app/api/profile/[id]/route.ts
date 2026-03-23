import { createAdminClient } from "@/lib/supabase/server";
import { winLossRecord, isCorrect } from "@/lib/scoring";
import { computeStreak } from "@/lib/streaks";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createAdminClient();

  const [profileResult, seasonResult, entriesResult, referralResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).single(),
    supabase
      .from("seasons")
      .select("*")
      .in("status", ["LIVE", "ENDED"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("season_entries")
      .select("id")
      .eq("user_id", id)
      .in("status", ["PAID", "JOINED"]),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("referred_by", id),
  ]);

  const profile = profileResult.data;
  if (!profile) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const season = seasonResult.data;
  const entries = entriesResult.data ?? [];
  const referrals = referralResult.count ?? 0;

  let wins = 0, losses = 0, questionsPlayed = 0, totalResolved = 0;
  let resolvedForecasts: any[] = [];
  let allForecasts: any[] = [];

  if (season) {
    const [allQuestionsResult, userForecastsResult] = await Promise.all([
      supabase
        .from("questions")
        .select("id, title, status, resolved_outcome")
        .eq("season_id", season.id),
      supabase
        .from("forecasts")
        .select("id, probability, question_id, submitted_at")
        .eq("user_id", id)
        .order("submitted_at", { ascending: false }),
    ]);

    const allQs = allQuestionsResult.data ?? [];
    const allQuestionIds = new Set(allQs.map((q) => q.id));
    const questionMap = new Map(allQs.map((q) => [q.id, q]));
    const resolvedQs = allQs.filter((q) => q.status === "RESOLVED");
    totalResolved = resolvedQs.length;
    const resolvedIds = new Set(resolvedQs.map((q) => q.id));

    const seasonForecasts = (userForecastsResult.data ?? []).filter((f) => allQuestionIds.has(f.question_id));

    allForecasts = seasonForecasts.map((f) => {
      const q = questionMap.get(f.question_id)!;
      return { id: f.id, probability: f.probability, question_id: f.question_id, submitted_at: f.submitted_at, question: { title: q.title, status: q.status, resolved_outcome: q.resolved_outcome } };
    });

    const resolvedUserForecasts = seasonForecasts.filter((f) => resolvedIds.has(f.question_id));
    const forCalc = resolvedUserForecasts.map((f) => {
      const q = questionMap.get(f.question_id)!;
      return { probability: f.probability, outcome: q.resolved_outcome as boolean };
    });

    const record = winLossRecord(forCalc);
    wins = record.wins;
    losses = record.losses;
    questionsPlayed = resolvedUserForecasts.length;

    resolvedForecasts = resolvedUserForecasts.map((f) => {
      const q = questionMap.get(f.question_id)!;
      return {
        questionId: f.question_id, probability: f.probability,
        outcome: q.resolved_outcome as boolean, title: q.title,
        correct: isCorrect(f.probability, q.resolved_outcome as boolean),
      };
    });
  }

  const badges: string[] = [];
  if (profile.is_wlu_verified) badges.push("W&L Verified");
  if (totalResolved > 0 && questionsPlayed >= totalResolved * 0.9) badges.push("Most Active");

  // Compute voting streak from all forecast timestamps
  const streak = computeStreak(allForecasts.map((f) => f.submitted_at));

  return NextResponse.json({
    profile: {
      id: profile.id, display_name: profile.display_name, name: profile.name,
      role: profile.role, is_wlu_verified: profile.is_wlu_verified, created_at: profile.created_at,
    },
    season: season ? { id: season.id, name: season.name } : null,
    wins, losses, questionsPlayed, totalForecasts: allForecasts.length,
    seasonCount: entries.length, referrals, badges, streak,
    resolvedForecasts, allForecasts,
  });
}
