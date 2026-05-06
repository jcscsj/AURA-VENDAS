import Stripe from "stripe";
import { ENV } from "./env";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!ENV.stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }
    stripeInstance = new Stripe(ENV.stripeSecretKey);
  }
  return stripeInstance;
}

export interface CheckoutSessionParams {
  userId: string;
  userEmail: string;
  userName?: string;
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    price: number; // in cents
  }>;
  total: number; // in cents
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession(params: CheckoutSessionParams) {
  const stripe = getStripe();

  const lineItems = params.items.map((item) => ({
    price_data: {
      currency: "brl",
      product_data: {
        name: item.productName,
      },
      unit_amount: item.price,
    },
    quantity: item.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer_email: params.userEmail,
    client_reference_id: params.userId,
    metadata: {
      user_id: params.userId,
      customer_email: params.userEmail,
      customer_name: params.userName || "Unknown",
    },
  });

  return session;
}

export async function retrieveCheckoutSession(sessionId: string) {
  const stripe = getStripe();
  return stripe.checkout.sessions.retrieve(sessionId);
}

export async function constructWebhookEvent(body: string, signature: string) {
  const stripe = getStripe();

  if (!ENV.stripeWebhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET environment variable is not set");
  }

  return stripe.webhooks.constructEvent(body, signature, ENV.stripeWebhookSecret);
}

export async function retrievePaymentIntent(paymentIntentId: string) {
  const stripe = getStripe();
  return stripe.paymentIntents.retrieve(paymentIntentId);
}

export async function retrieveCharge(chargeId: string) {
  const stripe = getStripe();
  return stripe.charges.retrieve(chargeId);
}
