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

// ── Comments pool (college student voice, no em dashes) ──
const sportsComments = [
  "ok but have you actually been to a game this year bc they look way better than last year",
  "nah no shot they pull this off lol",
  "my roommate is on the team and he said they're locked in this season fr",
  "we literally never win these things but im putting YES anyway out of school spirit",
  "went to the game saturday and the vibes were immaculate ngl",
  "ODAC is a coin flip every year idk why anyone is confident here",
  "this is free money for YES just watch",
  "bro they lost to bridgewater last year.. im going NO sorry",
  "lowkey we have some insane freshmen this year, dont sleep on this",
  "the coach is cooking this year you can tell",
  "idk anything about sports but 50% feels right so thats what im going with",
  "putting 80% bc my friend said theyre actually good and i trust him",
  "lmaooo the amount of copium in these comments",
  "wait do club sports count or just varsity? someone clarify",
  "been going to every game and honestly.. yeah they might do it",
];

const campusComments = [
  "bro this happens literally every single year lol",
  "no way admin actually does this",
  "heard about this in the groupchat and immediately came here to bet",
  "wait does anyone actually know how this gets decided or are we all guessing",
  "classic W&L honestly",
  "im going YES purely on vibes",
  "everyone in my house thinks NO so naturally im going the other way",
  "this would be so funny if it actually happened",
  "talked to an RA about this and they had no idea either lmao",
  "whoever made this market is a genius bc nobody knows the answer",
  "ok but why is the consensus so high?? what do yall know that i dont",
  "putting my forecast in at 2am because thats when i make my best decisions apparently",
  "my gut says YES but my brain says NO so im going 50/50",
  "this is the most W&L thing to bet on lol love it",
  "anyone else change their forecast like 5 times already",
];

const academicComments = [
  "there is absolutely no chance this happens before may lol",
  "my professor literally mentioned this in class today wtf",
  "W&L admin moves so slow on stuff like this theres no way",
  "wait i actually think this could happen tho, they've been hinting at it",
  "going NO bc this school never changes anything",
  "ok hot take but i think YES and im not explaining myself",
  "asked my advisor and she just laughed so take that how you want",
  "the rankings thing is so random year to year honestly just a coin flip",
  "dont overthink this one yall, just go with your gut",
  "bruh i have a midterm tomorrow why am i on here forecasting",
  "im an econ major trust me on this one (dont actually trust me)",
  "saw something about this on the school instagram story so maybe YES?",
  "every year people say this will happen and every year it doesnt",
  "putting 30% and moving on with my life",
  "this is actually a really interesting question ngl",
];

const otherComments = [
  "i have absolutely no basis for my prediction and im ok with that",
  "changed my answer three times already tonight lmao",
  "going full send on this one, 90% YES",
  "everyone in these comments is way too confident",
  "this is the market im most invested in emotionally for some reason",
  "wait can someone explain how scoring works again",
  "just gonna go with whatever the consensus is minus 10%",
  "im literally just guessing at this point but its fun",
  "who else is up at midnight doing this instead of studying",
  "ok i looked into this for like 20 minutes and im going with NO",
  "the consensus is wrong on this one trust",
  "someone in my econ class said this is basically guaranteed so... YES?",
  "this one is so hard to call honestly could go either way",
  "locking in my forecast and deleting the app so i dont change it again",
  "im gonna be so salty if i lose points on this one",
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
