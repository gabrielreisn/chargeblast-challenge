// Shared by the request-time loader (src/lib/payments-data.ts) and the
// `pnpm stripe:import` script. Node runs this file directly through type
// stripping, so imports are relative and keep their `.ts` extension.
import Stripe from "stripe";
import { snapshotSchema, type Snapshot, type SnapshotSource } from "./model.ts";
import { assertSandboxKey, normalizeCharge, normalizePayment } from "./normalize.ts";

/** Snapshots are capped at the schema maximum; larger accounts show their newest payments. */
export const STRIPE_PAYMENT_LIMIT = 1000;

export type StripePaymentsClient = Pick<Stripe, "paymentIntents" | "charges">;

type FetchStripeSnapshotOptions = {
  source: Extract<SnapshotSource, "stripe-sandbox" | "stripe-api">;
  limit?: number;
};

/** Sandbox-only client. Throws for missing or live keys before any request is made. */
export function createStripeClient(key: string | undefined) {
  assertSandboxKey(key);
  return new Stripe(key, { maxNetworkRetries: 3, timeout: 30_000 });
}

type ListOptions = { limit: number; createdBefore: number };

async function listPaymentIntents(
  stripe: StripePaymentsClient,
  { limit, createdBefore }: ListOptions,
) {
  const payments = [];
  for await (const intent of stripe.paymentIntents.list({
    limit: 100,
    created: { lte: createdBefore },
    expand: ["data.customer", "data.latest_charge", "data.payment_method"],
  })) {
    payments.push(normalizePayment(intent));
    if (payments.length >= limit) break;
  }
  return payments;
}

/** Charges without a PaymentIntent; the rest are already represented by their PaymentIntent. */
async function listStandaloneCharges(
  stripe: StripePaymentsClient,
  { limit, createdBefore }: ListOptions,
) {
  const payments = [];
  for await (const charge of stripe.charges.list({
    limit: 100,
    created: { lte: createdBefore },
    expand: ["data.customer"],
  })) {
    if (charge.payment_intent) continue;
    payments.push(normalizeCharge(charge));
    if (payments.length >= limit) break;
  }
  return payments;
}

/**
 * Reads PaymentIntents and standalone Charges (what Stripe's Payments page
 * lists), newest first with the related objects the table needs, then
 * normalizes and validates them. Live-mode objects are rejected.
 */
export async function fetchStripeSnapshot(
  stripe: StripePaymentsClient,
  { source, limit = STRIPE_PAYMENT_LIMIT }: FetchStripeSnapshotOptions,
): Promise<Snapshot> {
  const options = { limit, createdBefore: Math.floor(Date.now() / 1000) };
  const [intents, charges] = await Promise.all([
    listPaymentIntents(stripe, options),
    listStandaloneCharges(stripe, options),
  ]);
  // Both lists arrive newest first; the sort is stable, so equal timestamps keep API order.
  const payments = [...intents, ...charges].sort((a, b) => b.created - a.created).slice(0, limit);
  return snapshotSchema.parse({
    schemaVersion: 1,
    source,
    importedAt: new Date().toISOString(),
    payments,
  });
}
