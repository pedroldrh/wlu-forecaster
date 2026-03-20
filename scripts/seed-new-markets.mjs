import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const [k, ...v] = l.split("=");
      return [k.trim(), v.join("=").trim().replace(/^"|"$/g, "")];
    })
);

const SB_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

import { createClient } from "@supabase/supabase-js";
const sb = createClient(SB_URL, SB_KEY);
const SEASON_ID = "a0000000-0000-0000-0000-000000000001";

const questions = [
  {
    season_id: SEASON_ID,
    title: "Will W&L women's tennis win a 23rd consecutive ODAC championship?",
    description:
      "W&L women's tennis has won 22 straight ODAC championships and 344 consecutive ODAC matches dating back to 1990. They were picked to win the 23rd in the 2026 preseason poll (11 of 12 first-place votes).\n\nResolution rules:\n- Resolves YES if W&L women's tennis wins the 2026 ODAC championship.\n- Resolves NO otherwise.\n\nSource: ODAC official results or generalssports.com.",
    category: "SPORTS",
    close_time: "2026-04-20T03:59:00Z",
    resolve_time: "2026-05-15T03:59:00Z",
    status: "OPEN",
  },
  {
    season_id: SEASON_ID,
    title: "Will University Chapel reopen by Law Commencement on May 15?",
    description:
      "University Chapel has been closed since October 2025 for HVAC modernization and gallery updates. It is expected to reopen by Law Commencement in May 2026.\n\nResolution rules:\n- Resolves YES if University Chapel is open to the public on or before May 15, 2026 (Law Commencement day).\n- Resolves NO if it remains closed past that date.\n\nSource: W&L official campus construction updates or news.",
    category: "CAMPUS",
    close_time: "2026-05-01T03:59:00Z",
    resolve_time: "2026-05-20T03:59:00Z",
    status: "OPEN",
  },
  {
    season_id: SEASON_ID,
    title: "Will Fancy Dress 2026 sell out?",
    description:
      'Fancy Dress is W&L\'s annual gala, a tradition since 1907. Tickets ("acceptance letters") go on sale each year and the event is attended by a majority of the student body.\n\nResolution rules:\n- Resolves YES if the Fancy Dress 2026 committee or W&L officially announces the event is sold out.\n- Resolves NO if tickets remain available through the event date.\n\nSource: Fancy Dress official social media (Instagram/Facebook) or W&L communications.',
    category: "GREEK",
    close_time: "2026-03-25T03:59:00Z",
    resolve_time: "2026-04-05T03:59:00Z",
    status: "OPEN",
  },
  {
    season_id: SEASON_ID,
    title: "Will demolition of Early-Fielding begin before July 1, 2026?",
    description:
      "The Founders Hall project requires demolition of the Early-Fielding building, expected to begin in early summer 2026 after Undergraduate Commencement (May 28). Construction will last 24 months.\n\nResolution rules:\n- Resolves YES if demolition work on Early-Fielding has visibly begun on or before June 30, 2026.\n- Resolves NO if demolition has not started by that date.\n\nSource: W&L campus construction updates or official news.",
    category: "CAMPUS",
    close_time: "2026-06-01T03:59:00Z",
    resolve_time: "2026-07-05T03:59:00Z",
    status: "OPEN",
  },
  {
    season_id: SEASON_ID,
    title: "Will the 2026 E-Summit student pitch competition have 10+ entries?",
    description:
      "W&L's 2026 Entrepreneurship Summit is March 20-21 and includes a student pitch competition. Jay Coen Gilbert (co-founder of B Lab) is the keynote speaker.\n\nResolution rules:\n- Resolves YES if the student pitch competition at the 2026 E-Summit has 10 or more student entries/teams.\n- Resolves NO if fewer than 10.\n\nSource: W&L E-Summit organizers, Connolly Entrepreneurship Society, or official event reporting.",
    category: "ACADEMICS",
    close_time: "2026-03-20T03:59:00Z",
    resolve_time: "2026-03-28T03:59:00Z",
    status: "OPEN",
  },
  {
    season_id: SEASON_ID,
    title: "Will W&L men's tennis finish the ODAC season undefeated?",
    description:
      "The No. 33 ranked W&L men's tennis team is currently 3-0 in ODAC play for spring 2026.\n\nResolution rules:\n- Resolves YES if W&L men's tennis finishes the 2026 ODAC regular season with zero conference losses.\n- Resolves NO if they lose any ODAC match.\n\nSource: generalssports.com or ODAC official results.",
    category: "SPORTS",
    close_time: "2026-04-15T03:59:00Z",
    resolve_time: "2026-05-10T03:59:00Z",
    status: "OPEN",
  },
  {
    season_id: SEASON_ID,
    title: "Will the undergraduate commencement speaker be announced before April 15?",
    description:
      "The 239th undergraduate Commencement is May 28, 2026. The speaker has not yet been announced as of March 2026.\n\nResolution rules:\n- Resolves YES if W&L officially announces the 2026 undergraduate commencement speaker on or before April 15, 2026.\n- Resolves NO if no announcement is made by that date.\n\nSource: W&L commencement page or official news.",
    category: "CAMPUS",
    close_time: "2026-04-10T03:59:00Z",
    resolve_time: "2026-04-20T03:59:00Z",
    status: "OPEN",
  },
  {
    season_id: SEASON_ID,
    title: "Will Evans Dining Hall close before Fall 2026 for construction?",
    description:
      "The Founders Hall project on Washington Street will require Evans Dining Hall to close during the construction period (expected to start summer 2026, lasting 24 months).\n\nResolution rules:\n- Resolves YES if Evans Dining Hall is closed to students on or before September 1, 2026 due to Founders Hall construction.\n- Resolves NO if it remains open past that date.\n\nSource: W&L campus construction updates, dining services, or official news.",
    category: "CAMPUS",
    close_time: "2026-07-01T03:59:00Z",
    resolve_time: "2026-09-05T03:59:00Z",
    status: "OPEN",
  },
  {
    season_id: SEASON_ID,
    title: "Will Mock Con 2028 announce its full executive team by December 2026?",
    description:
      "Mock Convention is W&L's student-run simulated presidential nominating convention held every 4 years. The 2028 Mock Con is already hiring its executive team.\n\nResolution rules:\n- Resolves YES if Mock Convention 2028 publicly announces its complete executive team on or before December 31, 2026.\n- Resolves NO otherwise.\n\nSource: mockconvention.com, Mock Con social media, or W&L news.",
    category: "CAMPUS",
    close_time: "2026-11-01T04:59:00Z",
    resolve_time: "2027-01-15T04:59:00Z",
    status: "OPEN",
  },
  {
    season_id: SEASON_ID,
    title: "Will the 2026 W&L Athletics Hall of Fame class have 5+ inductees?",
    description:
      "W&L Athletics announced its 2026 Hall of Fame class in March 2026.\n\nResolution rules:\n- Resolves YES if the 2026 W&L Athletics Hall of Fame class includes 5 or more inductees.\n- Resolves NO if fewer than 5.\n\nSource: generalssports.com Hall of Fame announcement.",
    category: "SPORTS",
    close_time: "2026-04-01T03:59:00Z",
    resolve_time: "2026-05-01T03:59:00Z",
    status: "OPEN",
  },
];

const { data: existing } = await sb
  .from("questions")
  .select("title")
  .eq("season_id", SEASON_ID);
const existingTitles = new Set((existing || []).map((q) => q.title));
const toInsert = questions.filter((q) => !existingTitles.has(q.title));

if (toInsert.length === 0) {
  console.log("All questions already exist.");
  process.exit(0);
}

const { data, error } = await sb
  .from("questions")
  .insert(toInsert)
  .select("id, title, category");

if (error) {
  console.error("Error:", error);
  process.exit(1);
}

console.log(`Inserted ${data.length} new markets:`);
data.forEach((q) => console.log(`  [${q.category}] ${q.title}`));
