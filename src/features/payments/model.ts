import { z } from "zod";

/** Stripe's payment statuses, in the order its Payments page lists them. */
export const statuses = [
  "succeeded",
  "refunded",
  "disputed",
  "failed",
  "uncaptured",
  "blocked",
  "incomplete",
  "canceled",
  "pending",
] as const;
export const methods = ["card", "ach", "wallet", "other"] as const;
export const statusLabels = {
  succeeded: "Succeeded",
  refunded: "Refunded",
  disputed: "Disputed",
  failed: "Failed",
  uncaptured: "Uncaptured",
  blocked: "Blocked",
  incomplete: "Incomplete",
  canceled: "Canceled",
  pending: "Pending",
};
export const methodLabels = { card: "Card", ach: "ACH", wallet: "Wallet", other: "Other" };
export const walletLabels: Record<string, string> = {
  apple_pay: "Apple Pay",
  google_pay: "Google Pay",
};

/** Timeline events, as Stripe's "Recent activity" names them. */
export const paymentEventTypes = [
  "created",
  "requires_action",
  "processing",
  "authorized",
  "succeeded",
  "failed",
  "blocked",
  "canceled",
  "refunded",
  "disputed",
] as const;
export const paymentEventLabels: Record<(typeof paymentEventTypes)[number], string> = {
  created: "Payment started",
  requires_action: "Waiting on the customer to authenticate",
  processing: "Payment processing",
  authorized: "Payment authorized, not yet captured",
  succeeded: "Payment succeeded",
  failed: "Payment failed",
  blocked: "Payment blocked by Radar",
  canceled: "Payment canceled",
  refunded: "Payment refunded",
  disputed: "Payment disputed",
};
const paymentEventSchema = z.object({
  type: z.enum(paymentEventTypes),
  created: z.number().int().nonnegative(),
});

export const riskLevels = ["normal", "elevated", "highest"] as const;
const cardChecks = ["pass", "fail", "unavailable", "unchecked"] as const;

/** Card details Stripe reports on the charge (`payment_method_details.card`). */
const cardDetailsSchema = z.object({
  funding: z.string().nullable(),
  expMonth: z.number().int().min(1).max(12).nullable(),
  expYear: z.number().int().nullable(),
  fingerprint: z.string().nullable(),
  /** ISO 3166-1 alpha-2 country of the card. */
  country: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .nullable(),
  cvcCheck: z.enum(cardChecks).nullable(),
  issuer: z.string().nullable(),
});

export const paymentSchema = z.object({
  id: z.string().min(1),
  customer: z.object({
    id: z.string().nullable(),
    name: z.string().nullable(),
    email: z.string().nullable(),
  }),
  amount: z.number().int().nonnegative(),
  currency: z.string().regex(/^[a-z]{3}$/),
  status: z.enum(statuses),
  sourceStatus: z.string(),
  method: z.enum(methods),
  methodType: z.string().nullable(),
  brand: z.string().nullable(),
  last4: z.string().nullable(),
  wallet: z.string().nullable(),
  created: z.number().int().nonnegative(),
  amountRefunded: z.number().int().nonnegative(),
  description: z.string().nullable(),
  /** Card details (cards and wallet-backed cards); null for bank debits and unknown methods. */
  card: cardDetailsSchema.nullable(),
  /** Bank name for ACH debits. */
  bankName: z.string().nullable(),
  /** Stripe's processing fee in minor units, once funds were captured. */
  fee: z.number().int().nonnegative().nullable(),
  /** Unix seconds when the funds become available in the balance. */
  availableOn: z.number().int().nonnegative().nullable(),
  statementDescriptor: z.string().nullable(),
  /** Why a payment was declined or blocked, in Stripe's words. */
  failureMessage: z.string().nullable(),
  refundedAt: z.number().int().nonnegative().nullable(),
  riskLevel: z.enum(riskLevels).nullable(),
  /** Radar's 0–99 score; higher is riskier. */
  riskScore: z.number().int().min(0).max(99).nullable(),
  metadata: z.record(z.string(), z.string()),
  /** Known moments in the payment's life, oldest first. */
  events: z.array(paymentEventSchema).min(1),
});
/**
 * synthetic: the committed demo fixture (`PAYMENTS_SOURCE=local`).
 * stripe-api: fetched from the Stripe API at request time (`PAYMENTS_SOURCE=remote`).
 */
const snapshotSources = ["synthetic", "stripe-api"] as const;
export const snapshotSourceLabels = {
  synthetic: "Synthetic demo fixture",
  "stripe-api": "Live from Stripe sandbox",
};
export const snapshotSchema = z.object({
  schemaVersion: z.literal(2),
  source: z.enum(snapshotSources),
  importedAt: z.iso.datetime(),
  payments: z.array(paymentSchema).max(1000),
});
export type Payment = z.infer<typeof paymentSchema>;
export type Snapshot = z.infer<typeof snapshotSchema>;
export type SnapshotSource = Snapshot["source"];
export type PaymentStatus = Payment["status"];
export type PaymentMethod = Payment["method"];
export type PaymentEvent = Payment["events"][number];
export type RiskLevel = (typeof riskLevels)[number];
