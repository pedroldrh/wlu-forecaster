// Generate AI images for all open markets using DALL-E 3 and upload to Supabase Storage
import { readFileSync } from "fs";
import OpenAI from "openai";
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

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const STYLE_PREFIX =
  "Pixar-style 3D animated illustration, stylized cartoon characters with expressive faces, cinematic lighting, vibrant colors, set at Washington and Lee University campus in Lexington Virginia. ";

const CATEGORY_SCENES = {
  SPORTS: "Athletic field or stadium setting with colonial brick buildings in background. ",
  CAMPUS: "Historic Colonnade with white columns, red brick buildings, green lawn. ",
  ACADEMICS: "University classroom or library with tall windows, warm wood, bookshelves. ",
  GREEK: "College house with a porch, string lights, festive party atmosphere. ",
  LAW_SCHOOL: "Stately law school building, courtroom interior, legal books. ",
  OTHER: "Scenic Lexington Virginia town with Blue Ridge mountains in background. ",
};

function buildPrompt(title, category) {
  let scene = CATEGORY_SCENES[category] || CATEGORY_SCENES.OTHER;
  // Extract subject from title for specificity
  const lower = title.toLowerCase();

  if (lower.includes("lacrosse"))
    return STYLE_PREFIX + "College lacrosse players in blue and white uniforms mid-game action on a green field. " + scene;
  if (lower.includes("baseball"))
    return STYLE_PREFIX + "College baseball players in blue and white uniforms, batter swinging, sunny day. " + scene;
  if (lower.includes("tennis"))
    return STYLE_PREFIX + "College tennis players in white on an outdoor court, mid-serve. " + scene;
  if (lower.includes("football"))
    return STYLE_PREFIX + "College football players in blue helmets, dramatic action shot. " + scene;
  if (lower.includes("track") || lower.includes("all-american"))
    return STYLE_PREFIX + "College track and field athlete mid-sprint on a running track. " + scene;
  if (lower.includes("basketball"))
    return STYLE_PREFIX + "College basketball game in a packed gymnasium. " + scene;
  if (lower.includes("swim"))
    return STYLE_PREFIX + "College swimmers diving into a pool. " + scene;
  if (lower.includes("hall of fame"))
    return STYLE_PREFIX + "Trophy display case with framed photos and golden plaques in a grand hall. " + scene;
  if (lower.includes("fancy dress"))
    return STYLE_PREFIX + "Elegant college gala with students in formal attire dancing under sparkling lights in a grand ballroom. " + scene;
  if (lower.includes("formal") || lower.includes("rain"))
    return STYLE_PREFIX + "College students at an outdoor formal event looking up at the sky, some with umbrellas. " + scene;
  if (lower.includes("chapel"))
    return STYLE_PREFIX + "Beautiful university chapel with white columns being renovated, scaffolding partially visible. " + scene;
  if (lower.includes("demolition") || lower.includes("early-fielding"))
    return STYLE_PREFIX + "University building with construction equipment nearby, an excavator next to a brick building. " + scene;
  if (lower.includes("dining") || lower.includes("evans"))
    return STYLE_PREFIX + "College dining hall with students eating, warm cafeteria lighting. " + scene;
  if (lower.includes("construction") || lower.includes("rockbridge") || lower.includes("washington street"))
    return STYLE_PREFIX + "University street with construction barriers and workers, colonial buildings on both sides. " + scene;
  if (lower.includes("commencement") || lower.includes("graduation"))
    return STYLE_PREFIX + "University graduation ceremony on a green lawn with students in caps and gowns. " + scene;
  if (lower.includes("mock con"))
    return STYLE_PREFIX + "Students at a political convention with banners, flags, and a podium in a packed gymnasium. " + scene;
  if (lower.includes("tuition") || lower.includes("parking") || lower.includes("expensive"))
    return STYLE_PREFIX + "Students looking at a notice board with worried expressions, stacks of coins nearby. " + scene;
  if (lower.includes("ranking") || lower.includes("u.s. news") || lower.includes("best value"))
    return STYLE_PREFIX + "A golden trophy or ranking badge with a university shield, celebratory confetti. " + scene;
  if (lower.includes("bar passage") || lower.includes("bar exam"))
    return STYLE_PREFIX + "Law students studying intensely at desks with thick legal textbooks. " + scene;
  if (lower.includes("moot court"))
    return STYLE_PREFIX + "Law students in suits arguing before a judge in a wood-paneled courtroom. " + scene;
  if (lower.includes("law review") || lower.includes("journal"))
    return STYLE_PREFIX + "Law students editing documents at a long table covered in papers and laptops. " + scene;
  if (lower.includes("clerk"))
    return STYLE_PREFIX + "A young professional in a suit walking into a grand federal courthouse. " + scene;
  if (lower.includes("federalist") || lower.includes("acs") || lower.includes("debate"))
    return STYLE_PREFIX + "Packed lecture hall with two podiums, students eagerly watching a debate. " + scene;
  if (lower.includes("blsa") || lower.includes("mock trial"))
    return STYLE_PREFIX + "Law students in suits practicing arguments in a courtroom setting. " + scene;
  if (lower.includes("powell") || lower.includes("lecture"))
    return STYLE_PREFIX + "Distinguished speaker at a podium in an ornate lecture hall. " + scene;
  if (lower.includes("1l") || lower.includes("enrollment") || lower.includes("class"))
    return STYLE_PREFIX + "Large group of eager new students walking into a law school building. " + scene;
  if (lower.includes("dean") || lower.includes("gpa") || lower.includes("acceptance"))
    return STYLE_PREFIX + "Student looking at a report card with a big smile, confetti. " + scene;
  if (lower.includes("honor") || lower.includes("ec "))
    return STYLE_PREFIX + "Serious students in a formal hearing room around a long table. " + scene;
  if (lower.includes("ring-tum phi") || lower.includes("newspaper"))
    return STYLE_PREFIX + "Student journalists working on a newspaper in a cluttered newsroom. " + scene;
  if (lower.includes("fraternity") || lower.includes("kappa") || lower.includes("greek"))
    return STYLE_PREFIX + "A grand fraternity house with columns and a manicured lawn. " + scene;
  if (lower.includes("snow"))
    return STYLE_PREFIX + "A beautiful snowy university campus with students having a snowball fight. " + scene;
  if (lower.includes("70") || lower.includes("temperature") || lower.includes("warm"))
    return STYLE_PREFIX + "Students lounging on a sunny green lawn, some in shorts and sunglasses. " + scene;
  if (lower.includes("e-summit") || lower.includes("entrepreneur") || lower.includes("pitch"))
    return STYLE_PREFIX + "Students presenting on stage with a pitch deck, judges watching. " + scene;
  if (lower.includes("major") || lower.includes("new"))
    return STYLE_PREFIX + "A university classroom with a professor unveiling something new on a chalkboard. " + scene;
  if (lower.includes("donation") || lower.includes("$10m"))
    return STYLE_PREFIX + "Grand ceremony with a giant check being presented on stage. " + scene;

  // Generic fallback based on category
  return STYLE_PREFIX + scene + "A scene related to: " + title;
}

async function downloadImage(url) {
  const res = await fetch(url);
  const buffer = Buffer.from(await res.arrayBuffer());
  return buffer;
}

async function generateAndUpload(question) {
  const prompt = buildPrompt(question.title, question.category);

  console.log(`  Generating: ${question.title.slice(0, 50)}...`);
  const result = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1024x1792", // Portrait for TikTok-style
    quality: "standard",
  });

  const imageUrl = result.data[0].url;
  const imageBuffer = await downloadImage(imageUrl);
  const fileName = `${question.id}.png`;

  const { error: uploadError } = await sb.storage
    .from("market-images")
    .upload(fileName, imageBuffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (uploadError) {
    console.log(`  Upload error: ${uploadError.message}`);
    return null;
  }

  const { data: publicUrl } = sb.storage.from("market-images").getPublicUrl(fileName);
  console.log(`  Uploaded: ${publicUrl.publicUrl.slice(0, 80)}...`);
  return publicUrl.publicUrl;
}

// Main
(async () => {
  const { data: questions } = await sb
    .from("questions")
    .select("id, title, category, status")
    .eq("status", "OPEN")
    .order("close_time", { ascending: true });

  console.log(`Generating images for ${questions.length} markets...\n`);

  const results = [];
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    console.log(`[${i + 1}/${questions.length}]`);
    try {
      const url = await generateAndUpload(q);
      results.push({ id: q.id, url });
    } catch (err) {
      console.log(`  FAILED: ${err.message}`);
      results.push({ id: q.id, url: null });
    }

    // Small delay to avoid rate limits
    if (i < questions.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Save mapping to a JSON file for later DB update
  const fs = await import("fs");
  fs.writeFileSync(
    "scripts/market-image-urls.json",
    JSON.stringify(results.filter((r) => r.url), null, 2)
  );
  console.log(`\nDone! ${results.filter((r) => r.url).length}/${questions.length} images generated.`);
  console.log("URLs saved to scripts/market-image-urls.json");
  console.log("\nTo update the DB, run the SQL to add image_url column, then run:");
  console.log("  node scripts/update-image-urls.mjs");
})();
