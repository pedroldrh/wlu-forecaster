import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
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
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      await supabase
        .from("season_entries")
        .update({
          status: "PAID",
          stripe_session_id: session.id,
          stripe_customer_id: (session.customer as string) || null,
          stripe_payment_intent: (session.payment_intent as string) || null,
          paid_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("season_id", seasonId)
        .eq("status", "PENDING");

      console.log(`Payment completed for user ${userId}, season ${seasonId}`);
    }
  }

  return NextResponse.json({ received: true });
}
