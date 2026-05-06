import { Router } from "express";
import { constructWebhookEvent } from "./_core/stripe";
import * as db from "./db";

const router = Router();

/**
 * Stripe webhook endpoint
 * Handles payment_intent.succeeded and other payment events
 */
router.post("/stripe/webhook", async (req, res) => {
  try {
    const signature = req.headers["stripe-signature"] as string;
    const body = req.body;

    if (!signature) {
      res.status(400).json({ error: "Missing stripe-signature header" });
      return;
    }

    let event;
    try {
      event = await constructWebhookEvent(body, signature);
    } catch (error) {
      console.error("[Stripe Webhook] Signature verification failed:", error);
      res.status(400).json({ error: "Invalid signature" });
      return;
    }

    console.log(`[Stripe Webhook] Received event: ${event.type}`);

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as any;
        console.log(`[Stripe Webhook] Payment succeeded: ${paymentIntent.id}`);

        // Update order status based on client_reference_id (user ID)
        // This is a simplified implementation
        // In production, you'd want to track payment_intent_id to order mapping
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as any;
        console.log(`[Stripe Webhook] Payment failed: ${paymentIntent.id}`);
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as any;
        console.log(`[Stripe Webhook] Checkout completed: ${session.id}`);

        // Here you would:
        // 1. Retrieve the order from database using client_reference_id
        // 2. Update order status to "completed" or "approved"
        // 3. Send confirmation email
        // 4. Trigger fulfillment process
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
