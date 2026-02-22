// Seed script: creates 20 fake users with forecasts on resolved questions
// Reads credentials from .env file — run from project root: node scripts/seed-users.mjs
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

// Step 1: Resolve a few more questions
const questionsToResolve = [
  { id: "6014a48c-60f7-48ea-8586-3409a63b5592", resolved_outcome: true },   // campus close weather → YES
  { id: "554804c8-5b77-45b4-b282-012abd4dd000", resolved_outcome: false },  // protest on campus → NO
  { id: "3ae0cca3-4d68-4e4c-acde-4ed34baedbce", resolved_outcome: true },   // Lexington restaurant close → YES
  { id: "a239e2f9-ed2f-4c86-b295-5c49a9544a94", resolved_outcome: false },  // professor viral → NO
  { id: "a59a2d8f-03a5-4166-91ba-b84115a417ed", resolved_outcome: true },   // snow before March 1 → YES
];

console.log("Resolving questions...");
for (const q of questionsToResolve) {
  await api("PATCH", `/rest/v1/questions?id=eq.${q.id}`, {
    status: "RESOLVED",
    resolved_outcome: q.resolved_outcome,
    resolved_at: new Date().toISOString(),
  });
}

// All resolved question IDs (including existing dining hall one)
const resolvedQuestions = [
  { id: "c11df6fc-209a-4cbb-9b72-8a4f4208798e", outcome: true },  // dining hall → YES
  { id: "6014a48c-60f7-48ea-8586-3409a63b5592", outcome: true },  // campus close weather → YES
  { id: "554804c8-5b77-45b4-b282-012abd4dd000", outcome: false }, // protest → NO
  { id: "3ae0cca3-4d68-4e4c-acde-4ed34baedbce", outcome: true },  // restaurant close → YES
  { id: "a239e2f9-ed2f-4c86-b295-5c49a9544a94", outcome: false }, // professor viral → NO
  { id: "a59a2d8f-03a5-4166-91ba-b84115a417ed", outcome: true },  // snow before March 1 → YES
];

// Some open questions to also bet on
const openQuestions = [
  "926d0800-c968-4886-b3a3-5e221cc6a0f8",
  "2a92f2f4-ff67-44ea-b322-e9f8da2c6a47",
  "330d4207-085b-4fbf-90a3-c6a458efd793",
  "571e66ea-7eb0-46fd-8456-c5f5b04d03f5",
  "57446eff-b094-4baf-a579-c8d517713d30",
  "fed9cb4b-248a-4caf-ab88-8d39c3a089d8",
  "03a585a6-fd98-40c7-9cd7-b68c3777de42",
  "67751d36-1de6-4f87-a1ff-16cca0e29757",
];

const displayNames = [
  "Lee Chapel Bat Colony CEO",
  "The Ghost of John Robinson",
  "Crying in Leyburn at 3am",
  "Red Square Squirrel Mafia",
  "Mock Con Conspiracy Theorist",
  "D-Hall Chicken Tender Hoarder",
  "Colonnade Gargoyle Whisperer",
  "Someone's Phi Delt Cooler",
  "General's Ghost on a Segway",
  "Windfall Lost My Deposit",
  "The Palms Bathroom Sommelier",
  "Brusher's Run Ankle Destroyer",
  "SAB Movie Nobody Watched",
  "Sorority Court Feral Cat",
  "Washington Hall Ceiling Leak",
  "VMI Cannon Alarm Clock",
  "Lexington's Only Uber Driver",
  "EC Honor System Snitch Bot",
  "Fancy Dress Blackout Historian",
  "Natty Light in a Nalgene",
];

console.log("Creating 20 users...");
const userIds = [];

for (let i = 0; i < 20; i++) {
  const email = `forecaster_user_${i + 1}@mail.wlu.edu`;

  // Create auth user via admin API
  const authRes = await fetch(`${SB_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password: `seedpass_${i + 1}_${Date.now()}`,
      email_confirm: true,
      user_metadata: { full_name: displayNames[i] },
    }),
  });

  const authData = await authRes.json();
  if (!authRes.ok) {
    // If user already exists, find them
    if (authData?.msg?.includes("already") || authData?.message?.includes("already")) {
      const existing = await api("GET", `/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id`);
      if (existing && existing.length > 0) {
        userIds.push(existing[0].id);
        console.log(`  User ${i + 1} already exists: ${existing[0].id}`);
        continue;
      }
    }
    console.error(`  Failed to create user ${i + 1}:`, JSON.stringify(authData));
    continue;
  }

  const userId = authData.id;
  userIds.push(userId);
  console.log(`  Created user ${i + 1}: ${userId} → ${displayNames[i]}`);

  // Update profile with display name and wlu verified
  await api("PATCH", `/rest/v1/profiles?id=eq.${userId}`, {
    display_name: displayNames[i],
    is_wlu_verified: true,
    name: displayNames[i],
  });
}

// Step 3: Create season entries for all users
console.log("Creating season entries...");
for (const userId of userIds) {
  // Check if entry already exists
  const existing = await api("GET", `/rest/v1/season_entries?user_id=eq.${userId}&season_id=eq.${SEASON_ID}&select=id`);
  if (existing && existing.length > 0) {
    console.log(`  Season entry already exists for ${userId}`);
    continue;
  }
  await api("POST", "/rest/v1/season_entries", {
    user_id: userId,
    season_id: SEASON_ID,
    status: "JOINED",
  });
}

// Step 4: Create forecasts for each user
console.log("Creating forecasts...");

function randProb(bias, spread) {
  // Generate a probability biased toward the correct answer
  const base = bias + (Math.random() - 0.5) * spread;
  return Math.max(0.01, Math.min(0.99, base));
}

for (let i = 0; i < userIds.length; i++) {
  const userId = userIds[i];
  // Each user's "skill" level — some are better forecasters than others
  const skill = 0.3 + (Math.random() * 0.5); // 0.3 to 0.8

  // Bet on resolved questions (each user bets on 4-6 of the 6 resolved)
  const numResolved = 4 + Math.floor(Math.random() * 3); // 4-6
  const shuffledResolved = [...resolvedQuestions].sort(() => Math.random() - 0.5);
  const userResolved = shuffledResolved.slice(0, numResolved);

  for (const q of userResolved) {
    // Good forecasters assign high probability to correct outcomes
    let prob;
    if (q.outcome) {
      prob = randProb(skill * 0.8 + 0.15, 0.4);
    } else {
      prob = randProb((1 - skill) * 0.7 + 0.05, 0.4);
    }
    prob = Math.round(prob * 100) / 100;

    // Random submission time in the past 2 months
    const daysAgo = Math.floor(Math.random() * 50) + 5;
    const submitted = new Date(Date.now() - daysAgo * 86400000).toISOString();

    await api("POST", "/rest/v1/forecasts", {
      user_id: userId,
      question_id: q.id,
      probability: prob,
      submitted_at: submitted,
    });
  }

  // Bet on some open questions too (2-5)
  const numOpen = 2 + Math.floor(Math.random() * 4);
  const shuffledOpen = [...openQuestions].sort(() => Math.random() - 0.5);
  for (let j = 0; j < numOpen; j++) {
    const prob = Math.round((Math.random() * 0.8 + 0.1) * 100) / 100;
    const daysAgo = Math.floor(Math.random() * 20) + 1;
    const submitted = new Date(Date.now() - daysAgo * 86400000).toISOString();

    await api("POST", "/rest/v1/forecasts", {
      user_id: userId,
      question_id: shuffledOpen[j],
      probability: prob,
      submitted_at: submitted,
    });
  }

  console.log(`  Forecasts created for user ${i + 1}: ${displayNames[i]}`);
}

console.log("\nDone! 20 users seeded with forecasts.");
