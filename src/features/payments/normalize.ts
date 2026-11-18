import type Stripe from "stripe";
import {
  paymentSchema,
  riskLevels,
  type Payment,
  type PaymentEvent,
  type PaymentStatus,
  type RiskLevel,
} from "./model";

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
  const balance =
    typeof charge?.balance_transaction === "object" ? charge.balance_transaction : null;
  const chargeCard = details?.card;
  const checks = chargeCard?.checks;
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
    card: card
      ? {
          funding: card.funding ?? null,
          expMonth: card.exp_month ?? null,
          expYear: card.exp_year ?? null,
          fingerprint: card.fingerprint ?? null,
          country: card.country ?? null,
          cvcCheck: cardCheck(checks?.cvc_check ?? card.checks?.cvc_check),
          issuer: chargeCard?.issuer ?? null,
        }
      : null,
    bankName: bank?.bank_name ?? null,
    // Fee and payout date live on the balance transaction, expanded when listing.
    fee: balance?.fee ?? null,
    availableOn: balance?.available_on ?? null,
    statementDescriptor: charge?.calculated_statement_descriptor ?? null,
    riskLevel: riskLevelFor(charge?.outcome?.risk_level),
    riskScore: charge?.outcome?.risk_score ?? null,
    refundedAt: charge?.refunds?.data?.[0]?.created ?? null,
  };
}

const knownChecks = new Set(["pass", "fail", "unavailable", "unchecked"]);

function cardCheck(value: string | null | undefined) {
  return value && knownChecks.has(value)
    ? (value as "pass" | "fail" | "unavailable" | "unchecked")
    : null;
}

/** Radar's levels outside the three the dashboard shows (not_assessed, unknown) read as none. */
function riskLevelFor(value: string | null | undefined): RiskLevel | null {
  return riskLevels.find((level) => level === value) ?? null;
}

/** Status events Stripe dates on the objects; anything it doesn't date is left out. */
function timelineFor(
  created: number,
  status: PaymentStatus,
  charge: Stripe.Charge | null,
  canceledAt: number | null,
  refundedAt: number | null,
) {
  const events: PaymentEvent[] = [{ type: "created", created }];
  const chargedAt = charge?.created ?? null;
  const add = (type: PaymentEvent["type"], at: number | null) => {
    if (at !== null) events.push({ type, created: at });
  };
  if (status === "succeeded" || status === "refunded" || status === "disputed")
    add("succeeded", chargedAt);
  if (status === "failed") add("failed", chargedAt);
  if (status === "blocked") add("blocked", chargedAt);
  if (status === "uncaptured") add("authorized", chargedAt);
  if (status === "pending") add("processing", chargedAt);
  if (status === "canceled") add("canceled", canceledAt);
  if (status === "refunded") add("refunded", refundedAt);
  return events.toSorted((a, b) => a.created - b.created);
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
  const status = paymentIntentStatus(intent, charge, fields.amountRefunded);
  return paymentSchema.parse({
    ...fields,
    id: intent.id,
    amount: intent.amount,
    currency: intent.currency,
    status,
    sourceStatus: intent.status,
    created: intent.created,
    description: intent.description,
    statementDescriptor: fields.statementDescriptor ?? intent.statement_descriptor ?? null,
    failureMessage:
      (charge?.outcome?.type === "blocked"
        ? charge.outcome.seller_message
        : (charge?.failure_message ?? intent.last_payment_error?.message)) ?? null,
    metadata: { ...intent.metadata },
    events: timelineFor(
      intent.created,
      status,
      charge,
      intent.canceled_at ?? null,
      fields.refundedAt,
    ),
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
  const status = chargeStatus(charge, fields.amountRefunded);
  return paymentSchema.parse({
    ...fields,
    id: charge.id,
    amount: charge.amount,
    currency: charge.currency,
    status,
    sourceStatus: chargeSourceStatus(charge),
    created: charge.created,
    description: charge.description,
    failureMessage:
      (charge.outcome?.type === "blocked"
        ? charge.outcome.seller_message
        : charge.failure_message) ?? null,
    metadata: { ...charge.metadata },
    // A legacy charge is created and settled in one step, so its own timestamp dates both.
    events: timelineFor(charge.created, status, charge, null, fields.refundedAt),
  });
}
