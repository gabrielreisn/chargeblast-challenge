// @vitest-environment node
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type Stripe from "stripe";
import { afterEach, expect, test } from "vitest";
import { importPayments } from "../../../scripts/import-payments";
const directories: string[] = [];
afterEach(async () => {
  await Promise.all(directories.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});
async function destination() {
  const dir = await mkdtemp(join(tmpdir(), "payments-import-"));
  directories.push(dir);
  return join(dir, "payments.json");
}
const payment = {
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
async function* none(): AsyncGenerator<unknown> {}
function client(
  intents: () => AsyncGenerator<unknown>,
  charges: () => AsyncGenerator<unknown> = none,
) {
  return { paymentIntents: { list: intents }, charges: { list: charges } } as unknown as Pick<
    Stripe,
    "paymentIntents" | "charges"
  >;
}
test("imports the SDK async iterator and writes only normalized data", async () => {
  const path = await destination();
  const count = await importPayments(
    client(async function* () {
      yield payment;
      yield { ...payment, id: "pi_next" };
    }),
    path,
  );
  expect(count).toBe(2);
  const json = JSON.parse(await readFile(path, "utf8"));
  expect(json.source).toBe("stripe-sandbox");
  expect(json.payments.map((p: { id: string }) => p.id)).toEqual(["pi_test", "pi_next"]);
  expect(JSON.stringify(json)).not.toContain("must-not-export");
});
test("preserves the previous snapshot if a later API page fails", async () => {
  const path = await destination();
  await writeFile(path, "previous-snapshot");
  await expect(
    importPayments(
      client(async function* () {
        yield payment;
        throw new Error("rate limited");
      }),
      path,
    ),
  ).rejects.toThrow("rate limited");
  expect(await readFile(path, "utf8")).toBe("previous-snapshot");
});
test("caps imports at 1000 and aborts on live data before writing", async () => {
  const path = await destination();
  expect(
    await importPayments(
      client(async function* () {
        for (let i = 0; i < 1005; i++) yield { ...payment, id: `pi_${i}` };
      }),
      path,
    ),
  ).toBe(1000);
  await expect(
    importPayments(
      client(async function* () {
        yield { ...payment, livemode: true };
      }),
      path,
    ),
  ).rejects.toThrow("Live payments");
  expect(JSON.parse(await readFile(path, "utf8")).payments).toHaveLength(1000);
});

test("caps request-time snapshots and labels them as fetched from the API", async () => {
  const { fetchStripeSnapshot } = await import("./stripe-source");
  const snapshot = await fetchStripeSnapshot(
    client(async function* () {
      for (let index = 0; index < 5; index += 1) yield { ...payment, id: `pi_${index}` };
    }),
    { source: "stripe-api", limit: 3 },
  );
  expect(snapshot.source).toBe("stripe-api");
  expect(snapshot.payments.map((p) => p.id)).toEqual(["pi_0", "pi_1", "pi_2"]);
});

test("refuses to build a client without a sandbox key", async () => {
  const { createStripeClient } = await import("./stripe-source");
  expect(() => createStripeClient(undefined)).toThrow("sandbox");
  expect(() => createStripeClient("sk_live_123")).toThrow("Live keys are rejected");
});

test("merges standalone legacy Charges with PaymentIntents, newest first, without duplicates", async () => {
  const { fetchStripeSnapshot } = await import("./stripe-source");
  const charge = {
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
  const snapshot = await fetchStripeSnapshot(
    client(
      async function* () {
        yield payment;
      },
      async function* () {
        yield charge;
        yield { ...charge, id: "ch_from_intent", payment_intent: "pi_test" };
      },
    ),
    { source: "stripe-api" },
  );
  expect(snapshot.payments.map((p) => [p.id, p.status, p.method, p.last4])).toEqual([
    ["ch_legacy", "succeeded", "card", "4242"],
    ["pi_test", "succeeded", "other", null],
  ]);
});
