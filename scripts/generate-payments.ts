// Generates data/payments.fixture.json: 500 deterministic, fictional payments.
//
//   pnpm data:generate                           # dated now
//   pnpm data:generate 2026-11-18T00:00:00Z      # reproducible: same date, same file
//
// Node runs this file directly (type stripping), so imports are relative and
// keep their `.ts` extension.
import { mkdir, writeFile } from "node:fs/promises";
import { snapshotSchema, type Payment, type Snapshot } from "../src/features/payments/model.ts";

const OUTPUT_PATH = "data/payments.fixture.json";
const PAYMENT_COUNT = 500;
/** The first payments land minutes apart "today"; the rest spread over 90 days. */
const RECENT_PAYMENT_COUNT = 20;
const RECENT_SPACING_SECONDS = 1400;
const HISTORY_SECONDS = 90 * 24 * 60 * 60;

const customerNames = [
  "Alex Morgan",
  "Sofia Martinez",
  "Oliver Chen",
  "Emma Wilson",
  "Lucas Santos",
  "Isabella Rossi",
  "Noah Patel",
  "Mia Thompson",
  "Gabriel Costa",
  "Amelia Clarke",
  "Ethan Williams",
  "Chloe Martin",
  "Theo Laurent",
  "Lily Anderson",
  "Leo Nakamura",
  "Grace Kim",
  "Benjamin Taylor",
  "Alice Pereira",
  "Henry Davis",
  "Charlotte Brown",
];

// Repeated entries weight the mix: mostly USD, mostly successful payments. Uncaptured is
// left out on purpose so the dashboard's empty status view has a real case to show.
const currencyCycle = ["usd", "usd", "usd", "eur", "gbp", "brl", "jpy"];
const statusCycle: Payment["status"][] = [
  "succeeded",
  "succeeded",
  "succeeded",
  "succeeded",
  "failed",
  "succeeded",
  "refunded",
  "succeeded",
  "pending",
  "succeeded",
  "disputed",
  "succeeded",
  "blocked",
  "incomplete",
  "canceled",
];
const cardBrands = ["visa", "mastercard", "amex"];
const descriptions = [
  "Subscription update",
  "Monthly subscription",
  "Invoice payment",
  "Subscription creation",
];

/** The Stripe status each dashboard status is derived from (see normalize.ts). */
const sourceStatusByStatus: Record<Payment["status"], string> = {
  succeeded: "succeeded",
  refunded: "succeeded",
  disputed: "succeeded",
  failed: "requires_payment_method",
  uncaptured: "requires_capture",
  blocked: "requires_payment_method",
  incomplete: "requires_action",
  canceled: "canceled",
  pending: "processing",
};

/**
 * Seeded linear congruential generator returning floats in [0, 1). A fixed seed
 * makes every run produce the same payments, so the fixture diff stays clean.
 */
function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

type Random = () => number;

function parseGenerationDate(argument: string | undefined) {
  const date = argument ? new Date(argument) : new Date();
  if (Number.isNaN(date.valueOf())) throw new Error("Provide a valid ISO generation date.");
  return date;
}

function paymentMethodFor(index: number): Payment["method"] {
  if (index % 13 === 0) return "ach";
  if (index % 9 === 0) return "wallet";
  return "card";
}

function emailFor(name: string, index: number) {
  // The first pass through the names keeps plain addresses; later ones get a suffix.
  const suffix = index >= customerNames.length ? String(index) : "";
  return `${name.toLowerCase().replaceAll(" ", ".")}${suffix}@example.com`;
}

/** Amount in minor units: 4–454 major units (×120 for JPY, which has no decimals). */
function randomAmount(random: Random, currency: string) {
  const minorUnitsPerMajor = currency === "jpy" ? 120 : 100;
  return Math.round((4 + random() * 450) * minorUnitsPerMajor);
}

function randomPaymentId(random: Random) {
  const characters = Array.from({ length: 24 }, () => Math.floor(random() * 36).toString(36));
  return `pi_3${characters.join("")}`;
}

function randomLast4(random: Random) {
  return String(1000 + Math.floor(random() * 9000));
}

function createdAt(random: Random, index: number, nowSeconds: number) {
  if (index < RECENT_PAYMENT_COUNT) return nowSeconds - index * RECENT_SPACING_SECONDS;
  return nowSeconds - Math.floor(random() * HISTORY_SECONDS);
}

function buildPayment(index: number, random: Random, nowSeconds: number): Payment {
  const name = customerNames[index % customerNames.length];
  const status = statusCycle[index % statusCycle.length];
  const currency = currencyCycle[index % currencyCycle.length];
  const method = paymentMethodFor(index);
  // Random values are drawn in a fixed order (amount, id, last 4, date) so the
  // seed always reproduces the same fixture. Don't reorder these calls.
  const amount = randomAmount(random, currency);
  const id = randomPaymentId(random);
  const last4 = randomLast4(random);
  const created = createdAt(random, index, nowSeconds);
  return {
    id,
    customer: { id: `cus_demo_${index}`, name, email: emailFor(name, index) },
    amount,
    currency,
    status,
    sourceStatus: sourceStatusByStatus[status],
    method,
    methodType: method === "ach" ? "us_bank_account" : "card",
    brand: method === "ach" ? null : cardBrands[index % cardBrands.length],
    last4,
    wallet: method === "wallet" ? (index % 2 ? "apple_pay" : "google_pay") : null,
    created,
    amountRefunded: status === "refunded" ? amount : 0,
    description: descriptions[index % descriptions.length],
  };
}

function generateSnapshot(now: Date): Snapshot {
  const random = createRandom(82971);
  const nowSeconds = Math.floor(now.valueOf() / 1000);
  const payments = Array.from({ length: PAYMENT_COUNT }, (_, index) =>
    buildPayment(index, random, nowSeconds),
  ).toSorted((a, b) => b.created - a.created);
  // Validate against the app's schema so a generator change can't ship a fixture the app rejects.
  return snapshotSchema.parse({
    schemaVersion: 1,
    source: "synthetic",
    importedAt: now.toISOString(),
    payments,
  });
}

const snapshot = generateSnapshot(parseGenerationDate(process.argv[2]));
await mkdir("data", { recursive: true });
await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Generated ${snapshot.payments.length} synthetic payments in ${OUTPUT_PATH}.`);
