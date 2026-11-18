// Generates data/payments.fixture.json: 500 deterministic, fictional payments.
//
//   pnpm data:generate                           # dated now
//   pnpm data:generate 2026-11-18T00:00:00Z      # reproducible: same date, same file
//
// Node runs this file directly (type stripping), so imports are relative and
// keep their `.ts` extension.
import { mkdir, writeFile } from "node:fs/promises";
import {
  snapshotSchema,
  type Payment,
  type PaymentEvent,
  type RiskLevel,
  type Snapshot,
} from "../src/features/payments/model.ts";

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

const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86_400;

/** Stripe's standard card pricing per currency: a percentage plus a fixed fee in minor units. */
const cardFees: Record<string, { percent: number; fixed: number }> = {
  usd: { percent: 2.9, fixed: 30 },
  eur: { percent: 2.9, fixed: 25 },
  gbp: { percent: 2.9, fixed: 20 },
  brl: { percent: 3.99, fixed: 39 },
  jpy: { percent: 3.6, fixed: 0 },
};
/** ACH Direct Debit: 0.8%, capped at 5.00 in the payment's currency. */
const ACH_FEE_PERCENT = 0.8;
const ACH_FEE_CAP = 500;
/** Statuses where money was captured, so a fee and a payout date exist. */
const capturedStatuses: Payment["status"][] = ["succeeded", "refunded", "disputed"];
const countryByCurrency: Record<string, string> = {
  usd: "US",
  eur: "DE",
  gbp: "GB",
  brl: "BR",
  jpy: "JP",
};
const cardFundings = ["credit", "debit", "credit", "prepaid"];
const declineReasons = [
  "Insufficient funds",
  "Do not honor",
  "Transaction not allowed",
  "Incorrect CVC",
  "Expired card",
];
const plans = ["starter", "pro", "business"];
/** Stripe's test-mode card issuer and bank, as its sandbox reports them. */
const TEST_CARD_ISSUER = "Stripe Payments UK Limited";
const TEST_BANK_NAME = "STRIPE TEST BANK";

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

function feeFor(amount: number, currency: string, method: Payment["method"]) {
  if (method === "ach") return Math.min(ACH_FEE_CAP, Math.round((amount * ACH_FEE_PERCENT) / 100));
  const { percent, fixed } = cardFees[currency];
  return Math.round((amount * percent) / 100) + fixed;
}

function randomFingerprint(random: Random) {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 16 }, () => alphabet[Math.floor(random() * alphabet.length)]).join(
    "",
  );
}

/**
 * Detail values drawn from their own generator, always the same count per payment, so adding
 * details never shifts the IDs, amounts or dates drawn from the main generator.
 */
function drawDetails(random: Random) {
  return {
    fingerprint: randomFingerprint(random),
    settleSeconds: 2 + Math.floor(random() * 18),
    refundDays: 1 + random() * 9,
    disputeDays: 3 + random() * 17,
    cancelHours: 1 + random() * 47,
    riskDraw: random(),
  };
}

type Details = ReturnType<typeof drawDetails>;

type TimelineOptions = {
  status: Payment["status"];
  created: number;
  nowSeconds: number;
  details: Details;
};

/** The payment's events, oldest first; nothing is dated after the generation time. */
function timelineFor({ status, created, nowSeconds, details }: TimelineOptions) {
  const at = (seconds: number) => Math.min(created + Math.round(seconds), nowSeconds);
  const events: PaymentEvent[] = [{ type: "created", created }];
  let refundedAt: number | null = null;
  if (capturedStatuses.includes(status))
    events.push({ type: "succeeded", created: at(details.settleSeconds) });
  if (status === "refunded") {
    refundedAt = at(details.refundDays * SECONDS_PER_DAY);
    events.push({ type: "refunded", created: refundedAt });
  }
  if (status === "disputed")
    events.push({ type: "disputed", created: at(details.disputeDays * SECONDS_PER_DAY) });
  if (status === "failed") events.push({ type: "failed", created: at(4) });
  if (status === "blocked") events.push({ type: "blocked", created: at(3) });
  if (status === "uncaptured") events.push({ type: "authorized", created: at(3) });
  if (status === "pending") events.push({ type: "processing", created: at(2) });
  if (status === "incomplete" || status === "canceled")
    events.push({ type: "requires_action", created: at(2) });
  if (status === "canceled")
    events.push({ type: "canceled", created: at(details.cancelHours * SECONDS_PER_HOUR) });
  return { events, refundedAt };
}

/** Radar evaluates card charges only; blocked payments carry the highest scores. */
function riskFor(status: Payment["status"], method: Payment["method"], draw: number) {
  const evaluated = method !== "ach" && !["incomplete", "canceled", "pending"].includes(status);
  if (!evaluated) return { riskLevel: null, riskScore: null };
  if (status === "blocked")
    return { riskLevel: "highest" as RiskLevel, riskScore: 80 + Math.floor(draw * 20) };
  const riskScore = Math.floor(draw * 75);
  return { riskLevel: (riskScore >= 65 ? "elevated" : "normal") as RiskLevel, riskScore };
}

function buildPayment(
  index: number,
  random: Random,
  detailRandom: Random,
  nowSeconds: number,
): Payment {
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
  const details = drawDetails(detailRandom);
  const captured = capturedStatuses.includes(status);
  const declineReason =
    status === "failed" ? declineReasons[Math.floor(index / 15) % declineReasons.length] : null;
  const { events, refundedAt } = timelineFor({ status, created, nowSeconds, details });
  const settleDays = method === "ach" ? 4 : 2;
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
    card:
      method === "ach"
        ? null
        : {
            funding: cardFundings[index % cardFundings.length],
            expMonth: 1 + (index % 12),
            expYear: 2027 + (index % 6),
            fingerprint: details.fingerprint,
            country: countryByCurrency[currency],
            // A bank never saw an attempt the customer didn't finish.
            cvcCheck:
              status === "incomplete" || status === "canceled"
                ? null
                : declineReason === "Incorrect CVC"
                  ? "fail"
                  : "pass",
            issuer: TEST_CARD_ISSUER,
          },
    bankName: method === "ach" ? TEST_BANK_NAME : null,
    fee: captured ? feeFor(amount, currency, method) : null,
    // Payouts land at midnight UTC, a few days after the charge.
    availableOn: captured
      ? (Math.floor(created / SECONDS_PER_DAY) + settleDays) * SECONDS_PER_DAY
      : null,
    statementDescriptor: "CRAMLY.AI",
    failureMessage: status === "blocked" ? "Blocked by Radar: highest risk level" : declineReason,
    refundedAt,
    ...riskFor(status, method, details.riskDraw),
    metadata:
      index % 3 === 0
        ? { order_id: `ord_${10_000 + index}`, plan: plans[Math.floor(index / 3) % plans.length] }
        : {},
    events,
  };
}

function generateSnapshot(now: Date): Snapshot {
  const random = createRandom(82971);
  const detailRandom = createRandom(51283);
  const nowSeconds = Math.floor(now.valueOf() / 1000);
  const payments = Array.from({ length: PAYMENT_COUNT }, (_, index) =>
    buildPayment(index, random, detailRandom, nowSeconds),
  ).toSorted((a, b) => b.created - a.created);
  // Validate against the app's schema so a generator change can't ship a fixture the app rejects.
  return snapshotSchema.parse({
    schemaVersion: 2,
    source: "synthetic",
    importedAt: now.toISOString(),
    payments,
  });
}

const snapshot = generateSnapshot(parseGenerationDate(process.argv[2]));
await mkdir("data", { recursive: true });
await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Generated ${snapshot.payments.length} synthetic payments in ${OUTPUT_PATH}.`);
