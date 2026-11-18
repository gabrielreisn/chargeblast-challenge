/**
 * Selected with the `PAYMENTS_SOURCE` environment variable (or a `.env` file).
 * local: committed fixture (or `data/stripe-payments.local.json` in development).
 * remote: PaymentIntents fetched from the Stripe API with `STRIPE_SECRET_KEY`.
 */
export const paymentsSources = ["local", "remote"] as const;

export type PaymentsSource = (typeof paymentsSources)[number];

export const PAYMENTS_SOURCE_ENV = "PAYMENTS_SOURCE";

function isPaymentsSource(value: string): value is PaymentsSource {
  return (paymentsSources as readonly string[]).includes(value);
}

/** Unset means `local`; anything other than a known source is a configuration error. */
export function parsePaymentsSource(value: string | undefined): PaymentsSource {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return "local";
  if (isPaymentsSource(normalized)) return normalized;
  throw new Error(
    `Invalid payments source "${value}". Use ${paymentsSources.map((s) => `"${s}"`).join(" or ")}.`,
  );
}
