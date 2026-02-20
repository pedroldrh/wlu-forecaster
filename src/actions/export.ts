"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { seasonScore, rankUsers, UserScore } from "@/lib/scoring";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") throw new Error("Admin access required");
  return user;
}

export async function getSeasonRankings(seasonId: string) {
  await requireAdmin();
  const supabase = await createAdminClient();

  // Get all paid entries with user profiles
  const { data: entries } = await supabase
    .from("season_entries")
    .select("user_id, paid_at, profiles(name, email)")
    .eq("season_id", seasonId)
    .eq("status", "PAID");

  if (!entries) return [];

  // Get all resolved questions for the season
  const { data: resolvedQuestions } = await supabase
    .from("questions")
    .select("id, resolved_outcome")
    .eq("season_id", seasonId)
    .eq("status", "RESOLVED");

  const resolvedMap = new Map(resolvedQuestions?.map((q) => [q.id, q.resolved_outcome]) || []);

  // Get all forecasts for resolved questions
  const resolvedIds = resolvedQuestions?.map((q) => q.id) || [];
  const { data: allForecasts } = resolvedIds.length > 0
    ? await supabase
        .from("forecasts")
        .select("user_id, question_id, probability")
        .in("question_id", resolvedIds)
    : { data: [] };

  const users: UserScore[] = entries.map((entry) => {
    const userForecasts = (allForecasts || [])
      .filter((f) => f.user_id === entry.user_id)
      .map((f) => ({
        probability: f.probability,
        outcome: resolvedMap.get(f.question_id)!,
      }));

    const profile = entry.profiles as unknown as { name: string; email: string };
    return {
      userId: entry.user_id,
      name: profile?.name || profile?.email || "Unknown",
      score: seasonScore(userForecasts),
      questionsPlayed: userForecasts.length,
      paidAt: entry.paid_at ? new Date(entry.paid_at) : null,
    };
  });

  return rankUsers(users);
}

export async function exportSeasonCSV(seasonId: string) {
  const rankings = await getSeasonRankings(seasonId);
  const supabase = await createAdminClient();

  const headers = ["Rank", "Name", "Email", "Score", "Questions Played"];
  const rows = await Promise.all(
    rankings.map(async (user, index) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.userId)
        .single();
      return [
        index + 1,
        user.name,
        profile?.email || "",
        (user.score * 100).toFixed(1) + "%",
        user.questionsPlayed,
      ].join(",");
    })
  );

  return [headers.join(","), ...rows].join("\n");
}

export async function finalizeSeason(seasonId: string) {
  await requireAdmin();
  const supabase = await createAdminClient();
  await supabase.from("seasons").update({ status: "ENDED" }).eq("id", seasonId);
  return { success: true };
}
