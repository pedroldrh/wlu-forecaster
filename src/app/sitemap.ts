import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://wluforcaster.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/questions`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/leaderboard`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/how-it-works`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/terms`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/privacy`, changeFrequency: "monthly", priority: 0.3 },
  ];

  // Dynamic market pages
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: questions } = await supabase
    .from("questions")
    .select("id, created_at")
    .order("created_at", { ascending: false });

  const questionPages: MetadataRoute.Sitemap = (questions ?? []).map((q) => ({
    url: `${baseUrl}/questions/${q.id}`,
    lastModified: q.created_at,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...questionPages];
}
