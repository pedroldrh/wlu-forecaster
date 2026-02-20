"use server";

import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function createCheckoutSession(seasonId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile?.is_wlu_verified) throw new Error("W&L verification required");

  const { data: season } = await supabase.from("seasons").select("*").eq("id", seasonId).single();
  if (!season) throw new Error("Season not found");
  if (season.status !== "LIVE") throw new Error("Season is not live");

  // Check if already paid
  const { data: existing } = await supabase
    .from("season_entries")
    .select("*")
    .eq("user_id", user.id)
    .eq("season_id", seasonId)
    .single();
  if (existing?.status === "PAID") throw new Error("Already entered");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${season.name} — Forecaster Entry`,
            description: `Entry fee for the ${season.name} forecasting tournament`,
          },
          unit_amount: season.entry_fee_cents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId: user.id,
      seasonId: season.id,
    },
    success_url: `${appUrl}/join/${seasonId}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/join/${seasonId}`,
  });

  // Upsert pending entry
  if (existing) {
    await supabase
      .from("season_entries")
      .update({ stripe_session_id: checkoutSession.id })
      .eq("user_id", user.id)
      .eq("season_id", seasonId);
  } else {
    await supabase.from("season_entries").insert({
      user_id: user.id,
      season_id: seasonId,
      status: "PENDING",
      stripe_session_id: checkoutSession.id,
    });
  }

  return { url: checkoutSession.url };
}
