import { createClient, createAdminClient } from "@/lib/supabase/server";
import { SwipeFeed } from "./swipe-feed";

export const metadata = {
  title: "Swipe — Forecaster",
  description: "Swipe through markets and vote YES or NO.",
};

export default async function SwipePage() {
  const supabase = await createAdminClient();
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  const { data: season } = await supabase
    .from("seasons")
    .select("id")
    .eq("status", "LIVE")
    .single();

  if (!season) {
    return <div className="text-center py-12 text-muted-foreground">No active season.</div>;
  }

  // Get all open markets
  const { data: questions } = await supabase
    .from("questions")
    .select("id, title, category, image_url, close_time, status")
    .eq("season_id", season.id)
    .eq("status", "OPEN")
    .gt("close_time", new Date().toISOString())
    .order("close_time", { ascending: true });

  if (!questions || questions.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">No open markets to vote on.</div>;
  }

  // Get user's existing votes
  const userVotes = new Map<string, boolean>();
  if (user) {
    const questionIds = questions.map((q) => q.id);
    const { data: forecasts } = await supabase
      .from("forecasts")
      .select("question_id, probability")
      .eq("user_id", user.id)
      .in("question_id", questionIds);

    for (const f of forecasts ?? []) {
      userVotes.set(f.question_id, f.probability >= 0.5);
    }
  }

  // Get vote counts
  const voteCounts = new Map<string, number>();
  for (const q of questions) {
    const { count } = await supabase
      .from("forecasts")
      .select("*", { count: "exact", head: true })
      .eq("question_id", q.id);
    voteCounts.set(q.id, count || 0);
  }

  // Get last 3 comments per question
  const commentsByQuestion = new Map<string, { content: string; display_name: string }[]>();
  for (const q of questions) {
    const { data: comments } = await supabase
      .from("comments")
      .select("content, user_id")
      .eq("question_id", q.id)
      .order("created_at", { ascending: false })
      .limit(3);

    if (comments && comments.length > 0) {
      const userIds = comments.map((c) => c.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, name")
        .in("id", userIds);

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.id, p.display_name || p.name || "Anon"])
      );

      commentsByQuestion.set(
        q.id,
        comments.map((c) => ({
          content: c.content,
          display_name: profileMap.get(c.user_id) || "Anon",
        }))
      );
    }
  }

  const markets = questions.map((q) => ({
    id: q.id,
    title: q.title,
    category: q.category,
    imageUrl: q.image_url,
    closeTime: q.close_time,
    voteCount: voteCounts.get(q.id) || 0,
    userVote: userVotes.get(q.id) ?? null,
    comments: commentsByQuestion.get(q.id) || [],
  }));

  // Put unvoted markets first
  const unvoted = markets.filter((m) => m.userVote === null);
  const voted = markets.filter((m) => m.userVote !== null);
  const sorted = [...unvoted, ...voted];

  return <SwipeFeed markets={sorted} isLoggedIn={!!user} />;
}
