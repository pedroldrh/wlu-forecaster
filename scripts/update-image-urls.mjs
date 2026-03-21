// Update questions table with generated image URLs
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
const urls = JSON.parse(readFileSync("scripts/market-image-urls.json", "utf8"));

let updated = 0;
for (const { id, url } of urls) {
  const { error } = await sb.from("questions").update({ image_url: url }).eq("id", id);
  if (error) console.log(`Failed ${id}: ${error.message}`);
  else updated++;
}
console.log(`Updated ${updated}/${urls.length} questions with image URLs.`);
