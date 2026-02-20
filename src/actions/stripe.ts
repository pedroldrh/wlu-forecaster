"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function createCheckoutSession(seasonId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  if (!session.user.isWluVerified) throw new Error("W&L verification required");

  const season = await prisma.season.findUnique({ where: { id: seasonId } });
  if (!season) throw new Error("Season not found");
  if (season.status !== "LIVE") throw new Error("Season is not live");

  // Check if already entered
  const existing = await prisma.seasonEntry.findUnique({
    where: { userId_seasonId: { userId: session.user.id, seasonId } },
  });
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
          unit_amount: season.entryFeeCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId: session.user.id,
      seasonId: season.id,
    },
    success_url: `${appUrl}/join/${seasonId}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/join/${seasonId}`,
  });

  // Create or update pending entry
  await prisma.seasonEntry.upsert({
    where: { userId_seasonId: { userId: session.user.id, seasonId } },
    update: { stripeSessionId: checkoutSession.id },
    create: {
      userId: session.user.id,
      seasonId,
      status: "PENDING",
      stripeSessionId: checkoutSession.id,
    },
  });

  return { url: checkoutSession.url };
}
