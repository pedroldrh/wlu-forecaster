import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const envFile = readFileSync(".env", "utf8");
const serviceRoleKey = envFile
  .split("\n")
  .find((l) => l.startsWith("SUPABASE_SERVICE_ROLE_KEY="))
  ?.split("=")
  .slice(1)
  .join("=")
  .trim();

if (!serviceRoleKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY not found in .env");
  process.exit(1);
}

const sb = createClient(
  "https://mzqnrkifaqopkrwnedmd.supabase.co",
  serviceRoleKey
);

const seasonId = "a0000000-0000-0000-0000-000000000001";

const questions = [
  {
    season_id: seasonId,
    title: "Will W&L Law move up in the U.S. News rankings from #36?",
    description:
      "Predict whether W&L Law School improves its U.S. News & World Report ranking from #36.\n\nResolution rules:\n- Resolves YES if W&L Law's rank in the next published U.S. News Best Law Schools ranking is numerically lower (better) than #36.\n- Resolves NO if it stays at #36 or drops.\n\nSource: U.S. News & World Report Best Law Schools official rankings page.",
    category: "LAW_SCHOOL",
    close_time: "2026-04-15T03:59:00Z",
    resolve_time: "2026-06-01T03:59:00Z",
    status: "OPEN",
  },
  {
    season_id: seasonId,
    title: "Will the Class of 2026 bar passage rate exceed 90%?",
    description:
      "Predict whether W&L Law's Class of 2026 first-time bar passage rate exceeds 90%.\n\nResolution rules:\n- Resolves YES if the first-time bar passage rate for W&L Law Class of 2026 graduates exceeds 90.0% as reported by the ABA or W&L Law.\n- Resolves NO otherwise.\n- The most recent reported rate was 89.4% for the Class of 2024.\n\nSource: ABA Standard 509 disclosures or W&L Law official reporting.",
    category: "LAW_SCHOOL",
    close_time: "2026-06-01T03:59:00Z",
    resolve_time: "2027-03-01T04:59:00Z",
    status: "OPEN",
  },
  {
    season_id: seasonId,
    title: "Will W&L Law's moot court team win a national competition?",
    description:
      "Predict whether W&L Law's Moot Court Executive Board (MCEB) wins first place in any national moot court competition this academic year.\n\nResolution rules:\n- Resolves YES if a W&L Law moot court team wins first place (not just advances) in any nationally recognized moot court competition on or before 2026-06-30.\n- Resolves NO otherwise.\n\nSource: W&L Law official news or MCEB announcements.",
    category: "LAW_SCHOOL",
    close_time: "2026-05-01T03:59:00Z",
    resolve_time: "2026-07-01T03:59:00Z",
    status: "OPEN",
  },
  {
    season_id: seasonId,
    title: "Will W&L Law Review publish Volume 83 on schedule?",
    description:
      "Predict whether the Washington and Lee Law Review publishes the first issue of Volume 83 by its expected publication date.\n\nResolution rules:\n- Resolves YES if Volume 83, Issue 1 of the W&L Law Review is published (print or online) on or before 2026-12-31.\n- Resolves NO if it is delayed past that date.\n\nSource: Washington and Lee Law Review website (lawreview.wlulaw.wlu.edu) or Scholarly Commons.",
    category: "LAW_SCHOOL",
    close_time: "2026-09-01T03:59:00Z",
    resolve_time: "2027-01-15T04:59:00Z",
    status: "OPEN",
  },
  {
    season_id: seasonId,
    title: "Will the incoming 1L class exceed 135 students?",
    description:
      "Predict whether W&L Law's incoming 1L class for Fall 2026 exceeds 135 students.\n\nResolution rules:\n- Resolves YES if the official Fall 2026 enrollment report shows more than 135 first-year J.D. students.\n- Resolves NO if 135 or fewer.\n- Recent classes have been 131-132 students.\n\nSource: W&L official enrollment report or ABA 509 disclosure.",
    category: "LAW_SCHOOL",
    close_time: "2026-08-01T03:59:00Z",
    resolve_time: "2026-10-01T03:59:00Z",
    status: "OPEN",
  },
  {
    season_id: seasonId,
    title: "Will a W&L Law graduate clerk for a federal circuit court this year?",
    description:
      "Predict whether at least one recent W&L Law graduate secures a federal circuit court clerkship starting in 2026-2027.\n\nResolution rules:\n- Resolves YES if W&L Law officially announces or confirms at least one graduate clerking for a U.S. Court of Appeals judge for a term starting in 2026 or 2027.\n- Resolves NO otherwise.\n\nSource: W&L Law career services announcements or official news.",
    category: "LAW_SCHOOL",
    close_time: "2026-06-01T03:59:00Z",
    resolve_time: "2026-10-01T03:59:00Z",
    status: "OPEN",
  },
  {
    season_id: seasonId,
    title: "Will the Federalist Society vs. ACS debate draw 100+ attendees?",
    description:
      "Predict whether any joint Federalist Society and American Constitution Society debate event at W&L Law draws 100 or more attendees this academic year.\n\nResolution rules:\n- Resolves YES if any joint Fed Soc / ACS debate at W&L Law has 100+ attendees as reported by either organization or W&L Law communications.\n- Resolves NO if no such event reaches that threshold or no joint event is held.\n\nSource: W&L Law event reporting, Fed Soc or ACS social media, or official W&L communications.",
    category: "LAW_SCHOOL",
    close_time: "2026-05-01T03:59:00Z",
    resolve_time: "2026-06-15T03:59:00Z",
    status: "OPEN",
  },
  {
    season_id: seasonId,
    title: "Will W&L Law maintain its #2 Best Value ranking?",
    description:
      "Predict whether W&L Law retains its #2 Best Value private law school ranking.\n\nResolution rules:\n- Resolves YES if W&L Law is ranked #1 or #2 in the next published Best Value private law school ranking (by National Jurist, preLaw, or equivalent).\n- Resolves NO if it drops to #3 or lower.\n\nSource: National Jurist, preLaw Magazine, or the publication that originally ranked W&L #2.",
    category: "LAW_SCHOOL",
    close_time: "2026-05-15T03:59:00Z",
    resolve_time: "2026-09-01T03:59:00Z",
    status: "OPEN",
  },
  {
    season_id: seasonId,
    title: "Will BLSA's mock trial team advance past regionals?",
    description:
      "Predict whether W&L Law's BLSA team advances past the regional round of the Thurgood Marshall Mock Trial Competition.\n\nResolution rules:\n- Resolves YES if the W&L Law BLSA mock trial team advances beyond the regional round of the National Black Law Students Association Thurgood Marshall Mock Trial Competition in 2026.\n- Resolves NO if they do not compete or are eliminated at regionals.\n\nSource: BLSA announcements, W&L Law news, or NBLSA official results.",
    category: "LAW_SCHOOL",
    close_time: "2026-04-01T03:59:00Z",
    resolve_time: "2026-05-15T03:59:00Z",
    status: "OPEN",
  },
  {
    season_id: seasonId,
    title: "Will the Powell Distinguished Lecture Series host a sitting judge?",
    description:
      "Predict whether the Lewis F. Powell, Jr. Distinguished Lecture Series at W&L Law hosts a sitting federal or state supreme court judge this academic year.\n\nResolution rules:\n- Resolves YES if at least one speaker in the 2025-2026 or 2026-2027 Powell Lecture Series is an active sitting federal judge or state supreme court justice.\n- Resolves NO otherwise.\n\nSource: W&L Law events calendar, Powell Board announcements, or official W&L communications.",
    category: "LAW_SCHOOL",
    close_time: "2026-05-15T03:59:00Z",
    resolve_time: "2026-06-30T03:59:00Z",
    status: "OPEN",
  },
];

async function seed() {
  const { data: existing } = await sb
    .from("questions")
    .select("title")
    .eq("season_id", seasonId);
  const existingTitles = new Set((existing || []).map((q) => q.title));

  const toInsert = questions.filter((q) => !existingTitles.has(q.title));

  if (toInsert.length === 0) {
    console.log("All law school questions already exist. No duplicates inserted.");
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

  console.log(`Inserted ${data.length} law school questions:`);
  data.forEach((q) => console.log(`  [${q.category}] ${q.title}`));
}

seed();
