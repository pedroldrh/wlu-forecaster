import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const [k, ...v] = l.split("=");
      return [k.trim(), v.join("=").trim().replace(/^"|"$/g, "")];
    })
);

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const SEASON_ID = "a0000000-0000-0000-0000-000000000001";

const questions = [
  {
    season_id: SEASON_ID,
    title: "Will W&L men's lacrosse win the 2026 ODAC championship?",
    description:
      "W&L men's lacrosse is currently ranked #15 nationally with a 3-3 record early in the 2026 season.\n\nResolution rules:\n- Resolves YES if W&L men's lacrosse wins the 2026 ODAC tournament championship.\n- Resolves NO otherwise.\n\nSource: ODAC official results or generalssports.com.",
    category: "SPORTS",
    close_time: "2026-04-25T03:59:00Z",
    resolve_time: "2026-05-15T03:59:00Z",
    status: "OPEN",
  },
  {
    season_id: SEASON_ID,
    title: "Will W&L men's track earn an NCAA All-American in outdoor 2026?",
    description:
      "W&L men's track & field just earned 13 All-Region indoor honors (second-most in program history) with multiple records broken, including DJ McDonough's 1:52.60 in the 800m.\n\nResolution rules:\n- Resolves YES if any W&L men's track & field athlete earns All-American status at the 2026 NCAA D-III Outdoor Championships.\n- Resolves NO otherwise.\n\nSource: USTFCCCA or NCAA official results.",
    category: "SPORTS",
    close_time: "2026-05-20T03:59:00Z",
    resolve_time: "2026-06-10T03:59:00Z",
    status: "OPEN",
  },
  {
    season_id: SEASON_ID,
    title: "Will Washington Street reopen to traffic before May 1?",
    description:
      "Washington Street has been closed for Phase 1a of W&L's low-temperature hot water (LTHW) utility infrastructure project. Completion is scheduled for 'early spring 2026.'\n\nResolution rules:\n- Resolves YES if Washington Street reopens to through vehicle traffic on or before April 30, 2026.\n- Resolves NO if it remains closed past that date.\n\nSource: W&L official announcement or Lexington city notice.",
    category: "CAMPUS",
    close_time: "2026-04-15T03:59:00Z",
    resolve_time: "2026-05-05T03:59:00Z",
    status: "OPEN",
  },
  {
    season_id: SEASON_ID,
    title: "Will the Rockbridge Building renovation finish before July 2026?",
    description:
      "The Rockbridge Building at 13 S. Main St. is being renovated to house the Registrar, Copy Center, Advancement Operations, Mock Convention offices, and archaeology lab space. Completion is anticipated 'late spring 2026' but the timeline is 'still being finalized.'\n\nResolution rules:\n- Resolves YES if W&L officially announces occupancy or completion of the Rockbridge Building on or before June 30, 2026.\n- Resolves NO otherwise.\n\nSource: W&L Columns or official capital projects updates.",
    category: "CAMPUS",
    close_time: "2026-06-01T03:59:00Z",
    resolve_time: "2026-07-10T03:59:00Z",
    status: "OPEN",
  },
  {
    season_id: SEASON_ID,
    title: "Will the 29th Mock Convention correctly predict the 2028 GOP nominee?",
    description:
      "W&L's Mock Convention is a quadrennial student-run simulated presidential nominating convention. The 29th Mock Convention (2024) made its prediction for the 2028 Republican nominee.\n\nResolution rules:\n- Resolves YES if the Mock Convention's predicted nominee matches the actual 2028 Republican presidential nominee as determined at the RNC.\n- Resolves NO otherwise.\n- This is a long-duration market.\n\nSource: mockconvention.com official prediction vs. RNC convention result.",
    category: "CAMPUS",
    close_time: "2028-06-01T03:59:00Z",
    resolve_time: "2028-08-01T03:59:00Z",
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

console.log(`Inserted ${data.length} bonus markets:`);
data.forEach((q) => console.log(`  [${q.category}] ${q.title}`));

// Now make all bots vote on these new questions
console.log("\nAdding bot forecasts...");
const [{ data: b1 }, { data: b2 }, { data: b3 }] = await Promise.all([
  sb.from("profiles").select("id").like("email", "active_user_%@mail.wlu.edu"),
  sb.from("profiles").select("id").like("email", "seeded_user_%@mail.wlu.edu"),
  sb.from("profiles").select("id").like("email", "forecaster_user_%@mail.wlu.edu"),
]);
const botIds = [...(b1 || []), ...(b2 || []), ...(b3 || [])].map((b) => b.id);

let inserted = 0;
for (const q of data) {
  for (const botId of botIds) {
    const prob = Math.round((Math.random() * 0.8 + 0.1) * 100) / 100;
    const daysAgo = Math.floor(2 + Math.random() * 16);
    const submittedAt = new Date(Date.now() - daysAgo * 86400000).toISOString();

    await sb.from("forecasts").insert({
      user_id: botId,
      question_id: q.id,
      probability: prob,
      submitted_at: submittedAt,
    });
    await sb.from("forecast_history").insert({
      question_id: q.id,
      user_id: botId,
      probability: prob,
      recorded_at: submittedAt,
    });

    // Clean trigger-generated now() entries
    const today = new Date().toISOString().split("T")[0];
    const { data: triggerEntries } = await sb
      .from("forecast_history")
      .select("id")
      .eq("question_id", q.id)
      .eq("user_id", botId)
      .gte("recorded_at", today + "T00:00:00Z")
      .neq("recorded_at", submittedAt);
    for (const e of triggerEntries || []) {
      await sb.from("forecast_history").delete().eq("id", e.id);
    }
    inserted++;
  }
}
console.log(`Added ${inserted} bot forecasts`);
console.log("Done!");
