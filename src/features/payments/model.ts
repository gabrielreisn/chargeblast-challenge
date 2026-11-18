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
  schemaVersion: z.literal(1),
  source: z.enum(snapshotSources),
  importedAt: z.iso.datetime(),
  payments: z.array(paymentSchema).max(1000),
});
export type Payment = z.infer<typeof paymentSchema>;
export type Snapshot = z.infer<typeof snapshotSchema>;
export type SnapshotSource = Snapshot["source"];
export type PaymentStatus = Payment["status"];
export type PaymentMethod = Payment["method"];
