import type Stripe from "stripe";
import { paymentSchema, type Payment, type PaymentStatus } from "./model";

// Translates Stripe API objects (PaymentIntents and legacy Charges) into the
// app's `Payment` schema, the same shape the committed fixture already uses.

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

/** Stripe payment method types the table groups into its four method filters. */
const methodByStripeType: Record<string, Payment["method"]> = {
  card: "card",
  us_bank_account: "ach",
  // Link is Stripe's saved-credentials wallet.
  link: "wallet",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CustomerContact = { name: string | null; email: string | null };

/**
 * Some legacy charges were created with the email typed into the billing name.
 * Treat an email-shaped name as the email (unless one is already known) so the
 * UI doesn't show an address as the customer's name.
 */
function separateEmailFromName({ name, email }: CustomerContact): CustomerContact {
  if (!name || !EMAIL_PATTERN.test(name.trim())) return { name, email };
  return { name: null, email: email ?? name.trim() };
}

// Deleted customers carry no `livemode`, so check for the field instead of typing it.
function assertTestMode(objects: (object | null)[]) {
  if (objects.some((object) => object && "livemode" in object && object.livemode === true))
    throw new Error("Live related objects cannot be imported.");
}

/** Wallet-backed cards (Apple Pay, Google Pay) count as wallets, not cards. */
function paymentMethodFor(type: string | null, wallet: string | null): Payment["method"] {
  if (wallet) return "wallet";
  return (type && methodByStripeType[type]) || "other";
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
  const contact = separateEmailFromName({
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
  });
  return {
    customer: {
      id: typeof customer === "string" ? customer : (customer?.id ?? null),
      ...contact,
    },
    method: paymentMethodFor(type, wallet),
    methodType: type,
    brand: card?.brand ?? null,
    last4: card?.last4 ?? bank?.last4 ?? null,
    wallet,
    amountRefunded: charge?.amount_refunded ?? 0,
  };
}

/** Radar blocks a payment by failing its charge with a "blocked" outcome. */
function isBlocked(charge: Stripe.Charge | null) {
  return charge?.outcome?.type === "blocked";
}

/**
 * Maps a PaymentIntent to Stripe's dashboard statuses. A dispute outranks a refund, which
 * outranks the intent's own state. A declined attempt leaves the intent waiting for a new
 * payment method: Radar blocks show as blocked, other declines as failed, and an intent that
 * never had an attempt (or still needs the customer) as incomplete.
 */
function paymentIntentStatus(
  intent: Stripe.PaymentIntent,
  charge: Stripe.Charge | null,
  amountRefunded: number,
): PaymentStatus {
  if (charge?.disputed) return "disputed";
  if (amountRefunded > 0) return "refunded";
  switch (intent.status) {
    case "succeeded":
      return "succeeded";
    case "requires_capture":
      return "uncaptured";
    case "canceled":
      return "canceled";
    case "processing":
      return "pending";
    case "requires_payment_method":
      if (isBlocked(charge)) return "blocked";
      return intent.last_payment_error ? "failed" : "incomplete";
    default:
      // requires_confirmation, requires_action: waiting on the customer.
      return "incomplete";
  }
}

/** Same precedence for legacy Charges; a succeeded charge that wasn't captured is uncaptured. */
function chargeStatus(charge: Stripe.Charge, amountRefunded: number): PaymentStatus {
  if (charge.disputed) return "disputed";
  if (amountRefunded > 0) return "refunded";
  if (isBlocked(charge)) return "blocked";
  if (charge.status === "failed") return "failed";
  if (charge.status === "pending") return "pending";
  return charge.captured ? "succeeded" : "uncaptured";
}

/** Uncaptured charges report "succeeded"; name them explicitly for the details page. */
function chargeSourceStatus(charge: Stripe.Charge) {
  return charge.status === "succeeded" && !charge.captured ? "uncaptured" : charge.status;
}

export function normalizePayment(intent: Stripe.PaymentIntent) {
  if (intent.livemode !== false) throw new Error("Live payments cannot be imported.");
  const charge = typeof intent.latest_charge === "object" ? intent.latest_charge : null;
  const paymentMethod =
    typeof intent.payment_method === "object"
      ? intent.payment_method
      : (intent.last_payment_error?.payment_method ?? null);
  const customer = typeof intent.customer === "object" ? intent.customer : null;
  assertTestMode([charge, customer, paymentMethod]);
  const fields = commonFields({
    charge,
    customer: intent.customer,
    paymentMethod,
    receiptEmail: intent.receipt_email,
  });
  return paymentSchema.parse({
    ...fields,
    id: intent.id,
    amount: intent.amount,
    currency: intent.currency,
    status: paymentIntentStatus(intent, charge, fields.amountRefunded),
    sourceStatus: intent.status,
    created: intent.created,
    description: intent.description,
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
  return paymentSchema.parse({
    ...fields,
    id: charge.id,
    amount: charge.amount,
    currency: charge.currency,
    status: chargeStatus(charge, fields.amountRefunded),
    sourceStatus: chargeSourceStatus(charge),
    created: charge.created,
    description: charge.description,
  });
}
