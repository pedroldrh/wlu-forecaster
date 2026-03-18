// Seed script: adds forecasts + comments from existing bot users on LAW_SCHOOL questions
// Run from project root: node scripts/seed-law-school-activity.mjs
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
if (!SB_URL || !SB_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const SEASON_ID = "a0000000-0000-0000-0000-000000000001";

const headers = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

async function api(method, path, body) {
  const res = await fetch(`${SB_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`${method} ${path} → ${res.status}: ${text}`);
    return null;
  }
  return text ? JSON.parse(text) : null;
}

function randBetween(min, max) {
  return min + Math.random() * (max - min);
}

function daysAgoISO(days) {
  return new Date(Date.now() - days * 86400000).toISOString();
}

// ── Law school comment pool ──
const lawComments = [
  "as a 1L i can confirm nobody knows how any of this works",
  "the law school is so small that everyone will know the answer to this within a week",
  "moot court people are insanely competitive they might actually pull this off",
  "lol imagine betting on bar passage rates instead of studying for the bar",
  "fed soc vs acs debates go crazy hard ngl, standing room only last time",
  "my friend on law review said theyre behind schedule but when are they not",
  "genuinely have no idea on this one just vibes",
  "the law school operates on a completely different timeline from the rest of campus",
  "someone in my section is way too confident about this and its making me nervous",
  "powell lecture series always brings fire speakers tbh",
  "ok but the real question is whether anyone in the law school sleeps",
  "im a 2L and ive learned to never predict anything about this school",
  "BLSA mock trial team is actually cracked they put in serious hours",
  "clerkship stats are always better than people expect from a school our size",
  "enrollment going up would be wild, sydney lewis is already packed",
  "the consensus is wrong on this one and im willing to die on this hill",
  "just asked my con law professor about this and he refused to answer lmao",
  "W&L law punches way above its weight honestly",
  "every 3L right now is stress-forecasting at 1am instead of doing their journal note",
  "ive changed my forecast 4 times today someone stop me",
  "this is the content i signed up for when i downloaded the app",
  "putting 65% and logging off before i second guess myself again",
  "the rankings game is so unpredictable year to year its basically a coin flip",
  "talked to career services and they were suspiciously optimistic",
  "ngl the law school questions are way more fun than i expected",
];

// ── Main ──
console.log("Fetching law school questions...");
const lawQs = await api(
  "GET",
  `/rest/v1/questions?season_id=eq.${SEASON_ID}&category=eq.LAW_SCHOOL&select=id,title,category,status`
);
if (!lawQs || lawQs.length === 0) {
  console.error("No LAW_SCHOOL questions found");
  process.exit(1);
}
console.log(`  Found ${lawQs.length} law school questions`);

// Get existing bot users (active_user + seeded_user emails)
console.log("\nFetching existing bot users...");
const botUsers1 = await api(
  "GET",
  `/rest/v1/profiles?email=like.active_user_%25%40mail.wlu.edu&select=id,display_name`
);
const botUsers2 = await api(
  "GET",
  `/rest/v1/profiles?email=like.seeded_user_%25%40mail.wlu.edu&select=id,display_name`
);
const botUsers = [...(botUsers1 || []), ...(botUsers2 || [])];
if (botUsers.length === 0) {
  console.error("No bot users found");
  process.exit(1);
}
console.log(`  Found ${botUsers.length} bot users`);

// Ensure all bot users have season entries
console.log("\nEnsuring season entries...");
for (const u of botUsers) {
  const existing = await api(
    "GET",
    `/rest/v1/season_entries?user_id=eq.${u.id}&season_id=eq.${SEASON_ID}&select=id`
  );
  if (existing && existing.length > 0) continue;
  await api("POST", "/rest/v1/season_entries", {
    user_id: u.id,
    season_id: SEASON_ID,
    status: "JOINED",
  });
}

// ── Forecasts ──
// For each question, 15-25 users forecast, spread across 1-21 days ago
// Some users update their forecast (creates multiple history entries for the graph)
console.log("\nCreating forecasts...");
let forecastCount = 0;
let historyCount = 0;

for (const q of lawQs) {
  const numForecasters = Math.min(botUsers.length, 15 + Math.floor(Math.random() * 11));
  const shuffled = [...botUsers].sort(() => Math.random() - 0.5).slice(0, numForecasters);

  // Base consensus for this question (random center point)
  const baseConsensus = randBetween(0.25, 0.75);

  for (const user of shuffled) {
    // Initial forecast: 7-21 days ago
    const initialDaysAgo = Math.floor(randBetween(7, 21));
    const initialProb = Math.round(Math.max(0.03, Math.min(0.97, baseConsensus + randBetween(-0.3, 0.3))) * 100) / 100;
    const initialTime = daysAgoISO(initialDaysAgo);

    // Check if forecast already exists
    const existing = await api(
      "GET",
      `/rest/v1/forecasts?user_id=eq.${user.id}&question_id=eq.${q.id}&select=id`
    );
    if (existing && existing.length > 0) continue;

    // Insert forecast
    await api("POST", "/rest/v1/forecasts", {
      user_id: user.id,
      question_id: q.id,
      probability: initialProb,
      submitted_at: initialTime,
    });
    forecastCount++;

    // Manually insert history with the correct past timestamp
    // (the trigger sets recorded_at=now(), so we add our own backdated entry)
    await api("POST", "/rest/v1/forecast_history", {
      question_id: q.id,
      user_id: user.id,
      probability: initialProb,
      recorded_at: initialTime,
    });
    historyCount++;

    // ~40% of users update their forecast 1-3 times (creates graph movement)
    if (Math.random() < 0.4) {
      const numUpdates = 1 + Math.floor(Math.random() * 3);
      let currentProb = initialProb;
      for (let u = 0; u < numUpdates; u++) {
        const updateDaysAgo = Math.max(1, initialDaysAgo - Math.floor(randBetween(2, initialDaysAgo)));
        const drift = randBetween(-0.15, 0.15);
        currentProb = Math.round(Math.max(0.03, Math.min(0.97, currentProb + drift)) * 100) / 100;
        const updateTime = daysAgoISO(updateDaysAgo);

        // Insert history entry for each update
        await api("POST", "/rest/v1/forecast_history", {
          question_id: q.id,
          user_id: user.id,
          probability: currentProb,
          recorded_at: updateTime,
        });
        historyCount++;
      }

      // Update the actual forecast to the latest value
      await api(
        "PATCH",
        `/rest/v1/forecasts?user_id=eq.${user.id}&question_id=eq.${q.id}`,
        { probability: currentProb, updated_at: daysAgoISO(1) }
      );
    }
  }
  console.log(`  ${q.title.slice(0, 50)}... → ${numForecasters} forecasters`);
}
console.log(`  Total: ${forecastCount} forecasts, ${historyCount} history entries`);

// ── Comments ──
console.log("\nAdding comments...");
let commentCount = 0;
for (const q of lawQs) {
  const numComments = 4 + Math.floor(Math.random() * 5); // 4-8 per question
  const usedComments = new Set();
  const shuffledUsers = [...botUsers].sort(() => Math.random() - 0.5);

  for (let c = 0; c < numComments && c < shuffledUsers.length; c++) {
    let comment;
    do {
      comment = lawComments[Math.floor(Math.random() * lawComments.length)];
    } while (usedComments.has(comment) && usedComments.size < lawComments.length);
    usedComments.add(comment);

    const daysAgo = Math.floor(Math.random() * 14) + 1;
    await api("POST", "/rest/v1/comments", {
      question_id: q.id,
      user_id: shuffledUsers[c].id,
      content: comment,
      created_at: daysAgoISO(daysAgo),
    });
    commentCount++;
  }
}
console.log(`  Added ${commentCount} comments across ${lawQs.length} questions`);

// Clean up duplicate forecast_history entries from the trigger
// The trigger creates a now() entry on INSERT, but we also manually inserted a backdated one
// Delete the now()-timestamped duplicates
console.log("\nCleaning up duplicate history entries from trigger...");
const today = new Date().toISOString().split("T")[0];
for (const q of lawQs) {
  // Delete history entries created today (from trigger) where we have a backdated version
  const todayEntries = await api(
    "GET",
    `/rest/v1/forecast_history?question_id=eq.${q.id}&recorded_at=gte.${today}T00:00:00Z&select=id,user_id`
  );
  if (todayEntries && todayEntries.length > 0) {
    for (const entry of todayEntries) {
      await api("DELETE", `/rest/v1/forecast_history?id=eq.${entry.id}`);
    }
    console.log(`  Cleaned ${todayEntries.length} trigger-generated entries for: ${q.title.slice(0, 40)}...`);
  }
}

console.log("\nDone! Law school questions now have forecasts, history, and comments.");
