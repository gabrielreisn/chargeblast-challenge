import type Stripe from "stripe";
import { paymentSchema, type Payment, type PaymentStatus } from "./model.ts";

export function assertSandboxKey(key: string | undefined): asserts key is string {
  if (!/^(sk|rk)_test_[A-Za-z0-9]+$/.test(key ?? ""))
    throw new Error(
      "A Stripe sandbox secret or restricted test key is required. Live keys are rejected.",
    );
}

type ExpandableCustomer = string | Stripe.Customer | Stripe.DeletedCustomer | null;

type PaymentParts = {
  charge: Stripe.Charge | null;
  customer: ExpandableCustomer;
  paymentMethod: Stripe.PaymentMethod | null;
  receiptEmail: string | null;
};

// Deleted customers carry no `livemode`, so check for the field instead of typing it.
function assertTestMode(objects: (object | null)[]) {
  if (objects.some((object) => object && "livemode" in object && object.livemode === true))
    throw new Error("Live related objects cannot be imported.");
}

/** Customer, payment method and refund fields shared by PaymentIntents and standalone Charges. */
function commonFields({ charge, customer, paymentMethod, receiptEmail }: PaymentParts) {
  const expandedCustomer =
    typeof customer === "object" && customer && !customer.deleted ? customer : null;
  const details = charge?.payment_method_details;
  const type = details?.type ?? paymentMethod?.type ?? null;
  const card = details?.card ?? paymentMethod?.card;
  const bank = details?.us_bank_account ?? paymentMethod?.us_bank_account;
  const wallet = card?.wallet?.type ?? null;
  const method: Payment["method"] =
    wallet || type === "link"
      ? "wallet"
      : type === "card"
        ? "card"
        : type === "us_bank_account"
          ? "ach"
          : "other";
  return {
    customer: {
      id: typeof customer === "string" ? customer : (customer?.id ?? null),
      name:
        expandedCustomer?.name ??
        charge?.billing_details?.name ??
        paymentMethod?.billing_details?.name ??
        null,
      email:
        expandedCustomer?.email ??
        charge?.billing_details?.email ??
        paymentMethod?.billing_details?.email ??
        receiptEmail ??
        null,
    },
    method,
    methodType: type,
    brand: card?.brand ?? null,
    last4: card?.last4 ?? bank?.last4 ?? null,
    wallet,
    amountRefunded: charge?.amount_refunded ?? 0,
  };
}

export function normalizePayment(pi: Stripe.PaymentIntent) {
  if (pi.livemode !== false) throw new Error("Live payments cannot be imported.");
  const charge = typeof pi.latest_charge === "object" ? pi.latest_charge : null;
  const paymentMethod =
    typeof pi.payment_method === "object"
      ? pi.payment_method
      : (pi.last_payment_error?.payment_method ?? null);
  const customer = typeof pi.customer === "object" && pi.customer ? pi.customer : null;
  assertTestMode([charge, customer, paymentMethod]);
  const fields = commonFields({
    charge,
    customer: pi.customer,
    paymentMethod,
    receiptEmail: pi.receipt_email,
  });
  const failed =
    pi.status === "canceled" ||
    (pi.status === "requires_payment_method" && Boolean(pi.last_payment_error));
  const status: PaymentStatus =
    fields.amountRefunded > 0
      ? "refunded"
      : pi.status === "succeeded"
        ? "succeeded"
        : failed
          ? "failed"
          : "pending";
  return paymentSchema.parse({
    ...fields,
    id: pi.id,
    amount: pi.amount,
    currency: pi.currency,
    status,
    sourceStatus: pi.status,
    created: pi.created,
    description: pi.description,
  });
}

/**
 * Charges created with the legacy Charges API have no PaymentIntent. Stripe's
 * Payments page lists them alongside PaymentIntents, so they're normalized the same way.
 */
export function normalizeCharge(charge: Stripe.Charge) {
  if (charge.livemode !== false) throw new Error("Live payments cannot be imported.");
  const customer = typeof charge.customer === "object" ? charge.customer : null;
  assertTestMode([customer]);
  const fields = commonFields({
    charge,
    customer: charge.customer,
    paymentMethod: null,
    receiptEmail: charge.receipt_email,
  });
  const status: PaymentStatus =
    fields.amountRefunded > 0
      ? "refunded"
      : charge.status === "succeeded" && charge.captured
        ? "succeeded"
        : charge.status === "failed"
          ? "failed"
          : "pending";
  return paymentSchema.parse({
    ...fields,
    id: charge.id,
    amount: charge.amount,
    currency: charge.currency,
    status,
    // Uncaptured charges report "succeeded"; keep that visible on the details page.
    sourceStatus: charge.captured || charge.status !== "succeeded" ? charge.status : "uncaptured",
    created: charge.created,
    description: charge.description,
  });
}
