import "server-only";
import { readFile } from "node:fs/promises";
import { cacheLife } from "next/cache";
import fixture from "../../data/payments.fixture.json";
import { snapshotSchema, type Snapshot } from "@/features/payments/model";
import { createStripeClient, fetchStripeSnapshot } from "@/features/payments/stripe-source";
import { PAYMENTS_SOURCE_ENV, parsePaymentsSource } from "@/lib/payments-source";

/**
 * Payments for the current request, from the source selected by the
 * `PAYMENTS_SOURCE` environment variable (`local` by default, or `remote`).
 * A failure here propagates to the route's `error.tsx` boundary.
 */
export async function getPaymentsData(): Promise<Snapshot> {
  const source = parsePaymentsSource(process.env[PAYMENTS_SOURCE_ENV]);
  return source === "remote" ? getStripeSnapshot() : getLocalSnapshot();
}

async function getLocalSnapshot() {
  if (process.env.NODE_ENV === "development") {
    try {
      const content = await readFile(`${process.cwd()}/data/stripe-payments.local.json`, "utf8");
      return snapshotSchema.parse(JSON.parse(content));
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }
  }
  return snapshotSchema.parse(fixture);
}

async function getStripeSnapshot() {
  "use cache";
  // Reuse a fetch for about a minute so navigation doesn't page through the API on every request.
  cacheLife("minutes");
  // The key is read inside the cached scope, never passed as an argument, so it stays out of cache keys.
  const stripe = createStripeClient(process.env.STRIPE_SECRET_KEY);
  return fetchStripeSnapshot(stripe, { source: "stripe-api" });
}
