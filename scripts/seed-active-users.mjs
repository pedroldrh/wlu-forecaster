// Seed script: creates 20 more fake users that look active — forecasts + comments
// Run from project root: node scripts/seed-active-users.mjs
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

// ── 20 new display names (W&L flavored) ──
const displayNames = [
  "Traveller's Personal Barista",
  "Leyburn Basement Gremlin",
  "Parking Lot F Survivor",
  "The Phi House Cat",
  "Mock Con Floor Manager",
  "D-Hall Waffle Iron Arsonist",
  "IFC Rush Chair Burner Phone",
  "Colonnade Crow Overlord",
  "WLU 404 Page Not Found",
  "Woods Creek Trail Ghost",
  "Graham-Lees Radiator Cultist",
  "Lost in Newcomb Hall",
  "Howe Hall Lab Rat Escape",
  "Chavis Park Disc Golf MVP",
  "Spring Term Sunburn Victim",
  "Outing Club Trail Mix Dealer",
  "Co-op Cookie Monster",
  "Liberty Hall Ruins Lurker",
  "Windfall Porch Philosopher",
  "VMI Parade Napper",
];

// ── Comments pool (realistic, per-category) ──
const sportsComments = [
  "I've been tracking their record and it's honestly not looking bad this year",
  "Last season was rough but the new recruits look solid",
  "Conference play is going to be the real test here",
  "Anyone been to the games? The energy is actually crazy this year",
  "I think people are underestimating this one",
  "The ODAC is so unpredictable, hard to call this",
  "Bold prediction: they overperform everyone's expectations",
  "Going with the field on this one, too many unknowns",
  "My roommate plays on the team and says morale is high",
  "Just watched their last game — defense looks elite",
];

const campusComments = [
  "This literally happens every year, easy YES",
  "Not so sure about this — admin has been pretty stubborn lately",
  "I heard rumors about this at the EC meeting last week",
  "Does anyone actually know how this gets decided?",
  "The real question is whether anyone would even notice",
  "I talked to someone in the admin building and they were super vague",
  "Seems like a safe NO bet honestly",
  "Weather this winter has been wild — wouldn't be surprised either way",
  "Classic W&L moment if this actually happens",
  "Everyone's gonna be wrong on this one, watch",
];

const academicComments = [
  "Rankings are kind of meaningless but it'd be nice",
  "The provost mentioned something about this in convocation",
  "I don't think they'd announce this without a big donor involved",
  "This feels like a longshot but the upside is huge",
  "My advisor said the faculty has been pushing for this",
  "Would be really surprised if this goes YES before May",
  "Already locked in my forecast — feeling confident",
  "I keep going back and forth on this one",
  "The trend data actually supports YES here",
  "No way this happens, putting 90% on NO",
];

const otherComments = [
  "Last year's data says this is more likely than people think",
  "I'm weirdly invested in this market",
  "Can someone explain the resolution criteria better?",
  "Changed my forecast three times already lol",
  "Going contrarian on this — everyone's wrong",
  "This is the most interesting market on the board rn",
  "Locking in my prediction and not touching it again",
  "The consensus seems way too high imo",
  "The consensus is actually pretty reasonable for once",
  "Late night forecast update — reconsidered everything",
];

function pickComments(category) {
  if (category === "SPORTS") return sportsComments;
  if (category === "CAMPUS") return campusComments;
  if (category === "ACADEMICS") return academicComments;
  return otherComments;
}

function randBetween(min, max) {
  return min + Math.random() * (max - min);
}

function daysAgoISO(days) {
  return new Date(Date.now() - days * 86400000).toISOString();
}

// ── Main ──
console.log("Fetching all questions...");
const allQuestions = await api("GET", `/rest/v1/questions?season_id=eq.${SEASON_ID}&select=id,title,category,status,resolved_outcome`);
if (!allQuestions || allQuestions.length === 0) {
  console.error("No questions found for the season");
  process.exit(1);
}

const resolvedQs = allQuestions.filter((q) => q.status === "RESOLVED");
const openQs = allQuestions.filter((q) => q.status === "OPEN");
console.log(`  Found ${resolvedQs.length} resolved, ${openQs.length} open questions`);

// Create users
console.log("\nCreating 20 users...");
const userIds = [];

for (let i = 0; i < 20; i++) {
  const email = `active_user_${i + 1}@mail.wlu.edu`;

  const authRes = await fetch(`${SB_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password: `activepass_${i + 1}_${Date.now()}`,
      email_confirm: true,
      user_metadata: { full_name: displayNames[i] },
    }),
  });

  const authData = await authRes.json();
  if (!authRes.ok) {
    if (authData?.msg?.includes("already") || authData?.message?.includes("already")) {
      const existing = await api("GET", `/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id`);
      if (existing && existing.length > 0) {
        userIds.push(existing[0].id);
        console.log(`  User ${i + 1} already exists: ${displayNames[i]}`);
        continue;
      }
    }
    console.error(`  Failed to create user ${i + 1}:`, JSON.stringify(authData));
    continue;
  }

  const userId = authData.id;
  userIds.push(userId);
  console.log(`  Created user ${i + 1}: ${displayNames[i]}`);

  await api("PATCH", `/rest/v1/profiles?id=eq.${userId}`, {
    display_name: displayNames[i],
    is_wlu_verified: true,
    name: displayNames[i],
  });
}

// Join season
console.log("\nCreating season entries...");
for (const userId of userIds) {
  const existing = await api("GET", `/rest/v1/season_entries?user_id=eq.${userId}&season_id=eq.${SEASON_ID}&select=id`);
  if (existing && existing.length > 0) continue;
  await api("POST", "/rest/v1/season_entries", {
    user_id: userId,
    season_id: SEASON_ID,
    status: "JOINED",
  });
}

// Forecasts
console.log("\nCreating forecasts...");
for (let i = 0; i < userIds.length; i++) {
  const userId = userIds[i];
  const skill = 0.35 + Math.random() * 0.45; // 0.35–0.80

  // Resolved questions — each user bets on most of them (4-all)
  const numResolved = Math.min(resolvedQs.length, 4 + Math.floor(Math.random() * (resolvedQs.length - 3)));
  const shuffled = [...resolvedQs].sort(() => Math.random() - 0.5);
  for (let j = 0; j < numResolved; j++) {
    const q = shuffled[j];
    const outcome = q.resolved_outcome;
    let prob;
    if (outcome) {
      prob = randBetween(skill * 0.7 + 0.15, 0.95);
    } else {
      prob = randBetween(0.05, (1 - skill) * 0.7 + 0.15);
    }
    prob = Math.round(Math.max(0.01, Math.min(0.99, prob)) * 100) / 100;

    await api("POST", "/rest/v1/forecasts", {
      user_id: userId,
      question_id: q.id,
      probability: prob,
      submitted_at: daysAgoISO(Math.floor(Math.random() * 45) + 5),
    });
  }

  // Open questions — each user bets on 3-7
  const numOpen = Math.min(openQs.length, 3 + Math.floor(Math.random() * 5));
  const shuffledOpen = [...openQs].sort(() => Math.random() - 0.5);
  for (let j = 0; j < numOpen; j++) {
    const prob = Math.round((Math.random() * 0.8 + 0.1) * 100) / 100;
    await api("POST", "/rest/v1/forecasts", {
      user_id: userId,
      question_id: shuffledOpen[j].id,
      probability: prob,
      submitted_at: daysAgoISO(Math.floor(Math.random() * 14) + 1),
    });
  }

  console.log(`  Forecasts for ${displayNames[i]}: ${numResolved} resolved + ${numOpen} open`);
}

// Comments — spread across questions
console.log("\nAdding comments...");
let commentCount = 0;
for (const q of allQuestions) {
  // 4–8 comments per question from random users
  const numComments = 4 + Math.floor(Math.random() * 5);
  const pool = pickComments(q.category);
  const usedComments = new Set();
  const shuffledUsers = [...userIds].sort(() => Math.random() - 0.5);

  for (let c = 0; c < numComments && c < shuffledUsers.length; c++) {
    let comment;
    // Pick a unique comment from the pool
    do {
      comment = pool[Math.floor(Math.random() * pool.length)];
    } while (usedComments.has(comment) && usedComments.size < pool.length);
    usedComments.add(comment);

    const daysAgo = Math.floor(Math.random() * 30) + 1;
    await api("POST", "/rest/v1/comments", {
      question_id: q.id,
      user_id: shuffledUsers[c],
      content: comment,
      created_at: daysAgoISO(daysAgo),
    });
    commentCount++;
  }
}
console.log(`  Added ${commentCount} comments across ${allQuestions.length} questions`);

console.log("\nDone! 20 active users seeded with forecasts and comments.");
