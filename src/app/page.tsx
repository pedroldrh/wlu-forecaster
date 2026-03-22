import { createClient, createAdminClient } from "@/lib/supabase/server";
import { HomeFeed } from "@/components/home-feed";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Create clients first (both need cookies(), must be sequential)
  const supabase = await createAdminClient();
  const authClient = await createClient();

  // Now run queries in parallel
  const [userResult, seasonResult] = await Promise.all([
    authClient.auth.getUser().then(({ data }) => data.user).catch(() => null),
    supabase
      .from("seasons")
      .select("id, name, prize_1st_cents, prize_2nd_cents, prize_3rd_cents, prize_4th_cents, prize_5th_cents, prize_bonus_cents")
      .eq("status", "LIVE")
      .single(),
  ]);

  const user = userResult;
  const season = seasonResult.data;

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

  // Get open markets + user's votes in parallel
  const [questionsResult, userForecastsResult] = await Promise.all([
    supabase
      .from("questions")
      .select("id, title, description, category, image_url")
      .eq("season_id", season.id)
      .eq("status", "OPEN")
      .gt("close_time", new Date().toISOString())
      .order("close_time", { ascending: true }),
    user
      ? supabase
          .from("forecasts")
          .select("question_id")
          .eq("user_id", user.id)
      : Promise.resolve({ data: [] as { question_id: string }[] }),
  ]);

  const questions = questionsResult.data;
  if (!questions || questions.length === 0) {
    return <HomeFeed markets={[]} isLoggedIn={!!user} seasonInfo={seasonInfo} />;
  }

  // Filter out voted markets
  const votedIds = new Set((userForecastsResult.data ?? []).map((f) => f.question_id));
  const unvotedQuestions = questions.filter((q) => !votedIds.has(q.id));

  if (unvotedQuestions.length === 0) {
    return <HomeFeed markets={[]} isLoggedIn={!!user} seasonInfo={seasonInfo} />;
  }

  // Get all vote counts in a single query using group-by via RPC,
  // or batch with Promise.all instead of sequential loop
  const unvotedIds = unvotedQuestions.map((q) => q.id);
  const { data: allForecasts } = await supabase
    .from("forecasts")
    .select("question_id")
    .in("question_id", unvotedIds);

  // Count forecasts per question in JS
  const voteCounts = new Map<string, number>();
  for (const f of allForecasts ?? []) {
    voteCounts.set(f.question_id, (voteCounts.get(f.question_id) || 0) + 1);
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
