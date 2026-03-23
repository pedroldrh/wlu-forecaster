import { createAdminClient } from "@/lib/supabase/server";
import { isCorrect } from "@/lib/scoring";
import { computeStreak } from "@/lib/streaks";
import { NextResponse } from "next/server";
import { TIMEZONE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await createAdminClient();

  const [profileResult, seasonResult] = await Promise.all([
    supabase.from("profiles").select("display_name, name").eq("id", userId).single(),
    supabase
      .from("seasons")
      .select("*")
      .in("status", ["LIVE", "ENDED"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
  ]);

  const profile = profileResult.data;
  const season = seasonResult.data;
  if (!profile || !season) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const [questionsResult, forecastsResult, participantResult] = await Promise.all([
    supabase
      .from("questions")
      .select("id, title, category, status, resolved_outcome")
      .eq("season_id", season.id),
    supabase
      .from("forecasts")
      .select("id, probability, question_id, submitted_at")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false }),
    supabase
      .from("season_entries")
      .select("id", { count: "exact", head: true })
      .eq("season_id", season.id)
      .in("status", ["PAID", "JOINED"]),
  ]);

  const allQs = questionsResult.data ?? [];
  const questionIds = new Set(allQs.map((q) => q.id));
  const questionMap = new Map(allQs.map((q) => [q.id, q]));
  const resolvedQs = allQs.filter((q) => q.status === "RESOLVED");

  const forecasts = (forecastsResult.data ?? []).filter((f) => questionIds.has(f.question_id));
  const resolvedForecasts = forecasts.filter((f) => {
    const q = questionMap.get(f.question_id);
    return q?.status === "RESOLVED" && q.resolved_outcome !== null;
  });

  // W-L record
  let wins = 0, losses = 0;
  const correctCalls: { title: string; category: string }[] = [];
  const wrongCalls: { title: string; category: string }[] = [];

  for (const f of resolvedForecasts) {
    const q = questionMap.get(f.question_id)!;
    const correct = isCorrect(f.probability, q.resolved_outcome as boolean);
    if (correct) {
      wins++;
      correctCalls.push({ title: q.title, category: q.category });
    } else {
      losses++;
      wrongCalls.push({ title: q.title, category: q.category });
    }
  }

  // Win rate
  const winRate = resolvedForecasts.length > 0
    ? Math.round((wins / resolvedForecasts.length) * 100)
    : 0;

  // Category breakdown
  const categoryWins = new Map<string, number>();
  const categoryTotal = new Map<string, number>();
  for (const f of resolvedForecasts) {
    const q = questionMap.get(f.question_id)!;
    const cat = q.category;
    categoryTotal.set(cat, (categoryTotal.get(cat) || 0) + 1);
    if (isCorrect(f.probability, q.resolved_outcome as boolean)) {
      categoryWins.set(cat, (categoryWins.get(cat) || 0) + 1);
    }
  }

  let bestCategory: { name: string; wins: number; total: number } | null = null;
  for (const [cat, total] of categoryTotal) {
    const w = categoryWins.get(cat) || 0;
    if (!bestCategory || w > bestCategory.wins || (w === bestCategory.wins && total < bestCategory.total)) {
      bestCategory = { name: cat, wins: w, total };
    }
  }

  // Voting time patterns
  const hourCounts = new Array(24).fill(0);
  for (const f of forecasts) {
    const hour = new Date(f.submitted_at).toLocaleString("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: TIMEZONE,
    });
    hourCounts[parseInt(hour)]++;
  }
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

  // Streak
  const streak = computeStreak(forecasts.map((f) => f.submitted_at));

  // Against the crowd — correct calls where majority voted the other way
  let againstCrowdWins = 0;
  for (const f of resolvedForecasts) {
    const q = questionMap.get(f.question_id)!;
    const correct = isCorrect(f.probability, q.resolved_outcome as boolean);
    if (!correct) continue;
    // Check if user was in minority — need all votes on this question
    // We'll approximate: user voted YES (prob >= 0.5) on a NO outcome or vice versa
    // Actually we need consensus data. Let's skip for now and just count contrarian correct calls
  }

  // Fastest vote — earliest submitted_at relative to question availability
  // (simplified: just note total forecasts)

  const displayName = profile.display_name || profile.name || "Anonymous";

  return NextResponse.json({
    displayName,
    seasonName: season.name,
    totalForecasts: forecasts.length,
    totalMarkets: allQs.length,
    resolvedCount: resolvedQs.length,
    participants: participantResult.count || 0,
    wins,
    losses,
    winRate,
    bestCategory,
    correctCalls: correctCalls.slice(0, 5),
    wrongCalls: wrongCalls.slice(0, 3),
    peakHour,
    streak,
    questionsPlayed: resolvedForecasts.length,
  });
}
