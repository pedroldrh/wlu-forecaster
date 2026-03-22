import { createClient, createAdminClient } from "@/lib/supabase/server";
import { HomeFeed } from "@/components/home-feed";

export default async function HomePage() {
  const supabase = await createAdminClient();
  let user: { id: string } | null = null;
  try {
    const authClient = await createClient();
    const { data } = await authClient.auth.getUser();
    user = data.user;
  } catch {}

  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .eq("status", "LIVE")
    .single();

  if (!season) {
    return <HomeFeed markets={[]} isLoggedIn={false} seasonInfo={null} />;
  }

  const totalPrizeCents =
    (season.prize_1st_cents || 0) +
    (season.prize_2nd_cents || 0) +
    (season.prize_3rd_cents || 0) +
    (season.prize_4th_cents || 0) +
    (season.prize_5th_cents || 0) +
    (season.prize_bonus_cents || 0);

  const seasonInfo = { name: season.name, totalPrizeCents };

  // Get all open markets
  const { data: questions } = await supabase
    .from("questions")
    .select("id, title, description, category, image_url, close_time, status")
    .eq("season_id", season.id)
    .eq("status", "OPEN")
    .gt("close_time", new Date().toISOString())
    .order("close_time", { ascending: true });

  if (!questions || questions.length === 0) {
    return <HomeFeed markets={[]} isLoggedIn={!!user} seasonInfo={seasonInfo} />;
  }

  // Filter out markets user has already voted on
  let unvotedQuestions = questions;
  if (user) {
    const questionIds = questions.map((q) => q.id);
    const { data: forecasts } = await supabase
      .from("forecasts")
      .select("question_id")
      .eq("user_id", user.id)
      .in("question_id", questionIds);

    const votedIds = new Set((forecasts ?? []).map((f) => f.question_id));
    unvotedQuestions = questions.filter((q) => !votedIds.has(q.id));
  }

  // Get vote counts
  const voteCounts = new Map<string, number>();
  for (const q of unvotedQuestions) {
    const { count } = await supabase
      .from("forecasts")
      .select("*", { count: "exact", head: true })
      .eq("question_id", q.id);
    voteCounts.set(q.id, count || 0);
  }

  const markets = unvotedQuestions.map((q) => ({
    id: q.id,
    title: q.title,
    description: q.description,
    category: q.category,
    imageUrl: q.image_url,
    voteCount: voteCounts.get(q.id) || 0,
  }));

  return <HomeFeed markets={markets} isLoggedIn={!!user} seasonInfo={seasonInfo} />;
}
