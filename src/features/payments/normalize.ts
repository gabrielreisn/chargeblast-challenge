import type Stripe from "stripe";
import { paymentSchema } from "./model.ts";

export function assertSandboxKey(key: string | undefined): asserts key is string {
  if (!/^(sk|rk)_test_[A-Za-z0-9]+$/.test(key ?? ""))
    throw new Error(
      "A Stripe sandbox secret or restricted test key is required. Live keys are rejected.",
    );
}
export function normalizePayment(pi: Stripe.PaymentIntent) {
  if (pi.livemode !== false) throw new Error("Live payments cannot be imported.");
  const charge = typeof pi.latest_charge === "object" ? pi.latest_charge : null;
  const customer =
    typeof pi.customer === "object" && pi.customer && !pi.customer.deleted ? pi.customer : null;
  const pm =
    typeof pi.payment_method === "object"
      ? pi.payment_method
      : (pi.last_payment_error?.payment_method ?? null);
  for (const related of [charge, customer, pm]) {
    if (related?.livemode === true) throw new Error("Live related objects cannot be imported.");
  }
  const details = charge?.payment_method_details;
  const type = details?.type ?? pm?.type ?? null;
  const card = details?.card ?? pm?.card;
  const bank = details?.us_bank_account ?? pm?.us_bank_account;
  const wallet = card?.wallet?.type ?? null;
  const amountRefunded = charge?.amount_refunded ?? 0;
  const failed =
    pi.status === "canceled" ||
    (pi.status === "requires_payment_method" && Boolean(pi.last_payment_error));
  return paymentSchema.parse({
    id: pi.id,
    customer: {
      id: typeof pi.customer === "string" ? pi.customer : (pi.customer?.id ?? null),
      name: customer?.name ?? charge?.billing_details?.name ?? pm?.billing_details?.name ?? null,
      email:
        customer?.email ??
        charge?.billing_details?.email ??
        pm?.billing_details?.email ??
        pi.receipt_email ??
        null,
    },
    amount: pi.amount,
    currency: pi.currency,
    status:
      amountRefunded > 0
        ? "refunded"
        : pi.status === "succeeded"
          ? "succeeded"
          : failed
            ? "failed"
            : "pending",
    sourceStatus: pi.status,
    method:
      wallet || type === "link"
        ? "wallet"
        : type === "card"
          ? "card"
          : type === "us_bank_account"
            ? "ach"
            : "other",
    methodType: type,
    brand: card?.brand ?? null,
    last4: card?.last4 ?? bank?.last4 ?? null,
    wallet,
    created: pi.created,
    amountRefunded,
    description: pi.description,
  });
}
