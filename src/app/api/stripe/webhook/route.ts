import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const seasonId = session.metadata?.seasonId;

    if (userId && seasonId) {
      await prisma.seasonEntry.updateMany({
        where: {
          userId,
          seasonId,
          status: "PENDING",
        },
        data: {
          status: "PAID",
          stripeSessionId: session.id,
          stripeCustomerId: session.customer as string | null,
          stripePaymentIntent: session.payment_intent as string | null,
          paidAt: new Date(),
        },
      });
      console.log(`Payment completed for user ${userId}, season ${seasonId}`);
    }
  }

  return NextResponse.json({ received: true });
}
