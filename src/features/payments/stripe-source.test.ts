// @vitest-environment node
import type Stripe from "stripe";
import { expect, test } from "vitest";
import {
  createStripeClient,
  fetchStripeSnapshot,
  type StripePaymentsClient,
} from "./stripe-source";

const paymentIntent = {
  id: "pi_test",
  amount: 1000,
  currency: "usd",
  status: "succeeded",
  livemode: false,
  created: 1700000000,
  customer: null,
  payment_method: null,
  latest_charge: null,
  description: null,
  client_secret: "must-not-export",
};

const legacyCharge = {
  id: "ch_legacy",
  object: "charge",
  amount: 2000,
  amount_refunded: 0,
  currency: "usd",
  status: "succeeded",
  captured: true,
  livemode: false,
  created: 1700000500,
  customer: null,
  payment_intent: null,
  billing_details: { name: null, email: null },
  payment_method_details: { type: "card", card: { brand: "visa", last4: "4242", wallet: null } },
  receipt_email: null,
  description: null,
};

type ListPages = () => AsyncGenerator<unknown>;

async function* noPages(): AsyncGenerator<unknown> {}

/** Fake Stripe client whose list calls yield like the SDK's auto-pagination. */
function fakeStripe(intents: ListPages, charges: ListPages = noPages): StripePaymentsClient {
  return { paymentIntents: { list: intents }, charges: { list: charges } } as unknown as Pick<
    Stripe,
    "paymentIntents" | "charges"
  >;
}

test("returns normalized payments only, without raw Stripe fields", async () => {
  const snapshot = await fetchStripeSnapshot(
    fakeStripe(async function* () {
      yield paymentIntent;
      yield { ...paymentIntent, id: "pi_next" };
    }),
  );
  expect(snapshot.source).toBe("stripe-api");
  expect(snapshot.payments.map((p) => p.id)).toEqual(["pi_test", "pi_next"]);
  expect(JSON.stringify(snapshot)).not.toContain("must-not-export");
});

test("merges standalone legacy Charges with PaymentIntents, newest first, without duplicates", async () => {
  const snapshot = await fetchStripeSnapshot(
    fakeStripe(
      async function* () {
        yield paymentIntent;
      },
      async function* () {
        yield legacyCharge;
        // Charges created by a PaymentIntent are already represented by it.
        yield { ...legacyCharge, id: "ch_from_intent", payment_intent: "pi_test" };
      },
    ),
  );
  expect(snapshot.payments.map((p) => [p.id, p.status, p.method, p.last4])).toEqual([
    ["ch_legacy", "succeeded", "card", "4242"],
    ["pi_test", "succeeded", "other", null],
  ]);
});

async function* manyIntents() {
  for (let index = 0; index < 1005; index += 1) yield { ...paymentIntent, id: `pi_${index}` };
}

test("caps snapshots at 1,000 payments by default and at a custom limit", async () => {
  expect((await fetchStripeSnapshot(fakeStripe(manyIntents))).payments).toHaveLength(1000);
  const limited = await fetchStripeSnapshot(fakeStripe(manyIntents), { limit: 3 });
  expect(limited.payments.map((p) => p.id)).toEqual(["pi_0", "pi_1", "pi_2"]);
});

test("rejects live-mode data and surfaces API failures", async () => {
  await expect(
    fetchStripeSnapshot(
      fakeStripe(async function* () {
        yield { ...paymentIntent, livemode: true };
      }),
    ),
  ).rejects.toThrow("Live payments");
  await expect(
    fetchStripeSnapshot(
      fakeStripe(async function* () {
        yield paymentIntent;
        throw new Error("rate limited");
      }),
    ),
  ).rejects.toThrow("rate limited");
});

test("refuses to build a client without a sandbox key", () => {
  expect(() => createStripeClient(undefined)).toThrow("sandbox");
  expect(() => createStripeClient("sk_live_123")).toThrow("Live keys are rejected");
});
