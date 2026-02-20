import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://mzqnrkifaqopkrwnedmd.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const seasonId = "a0000000-0000-0000-0000-000000000001";

const questions = [
  {
    season_id: seasonId,
    title: "Will W&L football finish the regular season above .500?",
    description: "Predict whether W&L football ends the regular season with more wins than losses.\n\nResolution rules:\n- Resolves YES if the official W&L athletics website lists the team's final regular season record as having more wins than losses.\n- Resolves NO otherwise.\n- Postseason games do not count.\n\nSource: Official W&L athletics website (football schedule/results page).",
    category: "SPORTS",
    close_time: "2026-09-02T03:59:00Z",
    resolve_time: "2026-12-01T04:59:00Z",
    status: "OPEN",
  },
  {
    season_id: seasonId,
    title: "Will W&L baseball win 20+ regular season games?",
    description: "Predict whether W&L baseball wins at least 20 regular season games.\n\nResolution rules:\n- Resolves YES if official records show 20 or more regular season wins.\n- Resolves NO if fewer than 20.\n- Postseason games do not count.\n\nSource: Official W&L athletics website (baseball schedule/results page).",
    category: "SPORTS",
    close_time: "2026-02-16T04:59:00Z",
    resolve_time: "2026-05-16T03:59:00Z",
    status: "OPEN",
  },
  {
    season_id: seasonId,
    title: "Will any W&L varsity team win a conference championship this academic year?",
    description: "Predict whether any W&L varsity team is officially recognized as a conference champion this academic year.\n\nResolution rules:\n- Resolves YES if at least one W&L varsity team is officially recognized as conference champion by its conference on or before 2026-06-30.\n- Resolves NO otherwise.\n\nSource: Conference official announcements and/or W&L athletics news/records pages.",
    category: "SPORTS",
    close_time: "2026-09-16T03:59:00Z",
    resolve_time: "2026-07-01T03:59:00Z",
    status: "OPEN",
  },
  {
    season_id: seasonId,
    title: "Will a W&L athlete earn All-American honors this season?",
    description: "Predict whether any W&L athlete is officially named an All-American this season.\n\nResolution rules:\n- Resolves YES if any W&L athlete is officially named an All-American by a recognized governing body on or before 2026-06-30.\n- Resolves NO otherwise.\n\nSource: Official governing body release + W&L athletics announcement.",
    category: "SPORTS",
    close_time: "2026-09-16T03:59:00Z",
    resolve_time: "2026-07-01T03:59:00Z",
    status: "OPEN",
  },
  {
    season_id: seasonId,
    title: "Will Lexington record \u22654 inches of snowfall in a single day this winter?",
    description: "Predict whether Lexington, VA records at least 4.0 inches of snowfall on any single calendar day this winter.\n\nResolution rules:\n- Resolves YES if NOAA daily climate data reports \u2265 4.0 inches of snowfall on any single calendar day between 2026-12-01 and 2027-03-01 (inclusive) at the Lexington area reporting station.\n- Resolves NO otherwise.\n\nSource: NOAA daily climate summaries for Lexington, VA station.",
    category: "OTHER",
    close_time: "2026-12-01T04:59:00Z",
    resolve_time: "2027-03-02T17:00:00Z",
    status: "OPEN",
  },
  {
    season_id: seasonId,
    title: "Will campus close at least once due to weather this semester?",
    description: "Predict whether W&L cancels all classes for one full academic day due to weather this semester.\n\nResolution rules:\n- Resolves YES if W&L officially cancels all classes for one full academic day due to weather on or before 2026-05-15.\n- Resolves NO otherwise.\n- Delays, early releases, or partial cancellations do not count.\n\nSource: Official W&L announcements (email/website alert/official notice archive).",
    category: "CAMPUS",
    close_time: "2026-02-26T04:59:00Z",
    resolve_time: "2026-05-16T03:59:00Z",
    status: "OPEN",
  },
  {
    season_id: seasonId,
    title: "Will tuition increase by more than 4% next academic year?",
    description: "Predict whether W&L published tuition increases by more than 4.0% for the next academic year.\n\nResolution rules:\n- Resolves YES if published tuition for 2026-2027 reflects an increase greater than 4.0% over published 2025-2026 tuition.\n- Resolves NO otherwise.\n\nSource: W&L official tuition and fees page (annual published tuition).",
    category: "CAMPUS",
    close_time: "2026-03-16T03:59:00Z",
    resolve_time: "2026-07-01T03:59:00Z",
    status: "OPEN",
  },
  {
    season_id: seasonId,
    title: "Will W&L announce a new undergraduate major before May 1, 2026?",
    description: "Predict whether W&L officially announces creation of a new undergraduate major before May 1, 2026.\n\nResolution rules:\n- Resolves YES if an official W&L press release announces a new undergraduate major before 2026-05-01 11:59 PM ET.\n- Resolves NO otherwise.\n\nSource: W&L official news/press release pages.",
    category: "ACADEMICS",
    close_time: "2026-03-01T04:59:00Z",
    resolve_time: "2026-05-02T03:59:00Z",
    status: "OPEN",
  },
  {
    season_id: seasonId,
    title: "Will W&L announce a donation exceeding $10M before June 30, 2026?",
    description: "Predict whether W&L publicly confirms a single donation of $10,000,000+ before June 30, 2026.\n\nResolution rules:\n- Resolves YES if an official W&L press release publicly confirms a single donation of $10,000,000 or more on or before 2026-06-30.\n- Resolves NO otherwise.\n\nSource: W&L official news/press releases.",
    category: "CAMPUS",
    close_time: "2026-03-16T03:59:00Z",
    resolve_time: "2026-07-01T03:59:00Z",
    status: "OPEN",
  },
  {
    season_id: seasonId,
    title: "Will W&L move up in at least one major college ranking next year?",
    description: "Predict whether W&L improves in at least one nationally recognized college ranking compared to the prior year.\n\nResolution rules:\n- Resolves YES if W&L's rank improves (numerically decreases) in at least one major national college ranking compared to its immediately prior-year rank.\n- Resolves NO if it stays the same or worsens in all such rankings.\n- If a ranking changes methodology, use the ranking's official published rank list.\n\nSource: Official published rankings (e.g., U.S. News, WSJ, etc.).",
    category: "ACADEMICS",
    close_time: "2026-08-16T03:59:00Z",
    resolve_time: "2026-10-16T03:59:00Z",
    status: "OPEN",
  },
];

async function seed() {
  // Idempotent: check for existing questions
  const { data: existing } = await sb
    .from("questions")
    .select("title")
    .eq("season_id", seasonId);
  const existingTitles = new Set((existing || []).map((q) => q.title));

  const toInsert = questions.filter((q) => !existingTitles.has(q.title));

  if (toInsert.length === 0) {
    console.log("All 10 questions already exist. No duplicates inserted.");
    return;
  }

  const { data, error } = await sb
    .from("questions")
    .insert(toInsert)
    .select("id, title, category, status");

  if (error) {
    console.error("Error:", error);
    process.exit(1);
  }

  console.log(`Inserted ${data.length} questions:`);
  data.forEach((q) => console.log(`  [${q.category}] ${q.title}`));
}

seed();
