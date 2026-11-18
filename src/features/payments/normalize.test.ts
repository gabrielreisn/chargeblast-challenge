import { describe, expect, test } from "vitest";
import type Stripe from "stripe";
import { assertSandboxKey, normalizeCharge, normalizePayment } from "./normalize";
const pi = (patch: Record<string, unknown> = {}) =>
  ({
    id: "pi_test",
    amount: 1234,
    currency: "usd",
    status: "succeeded",
    livemode: false,
    created: 1700000000,
    customer: null,
    latest_charge: null,
    payment_method: null,
    description: null,
    ...patch,
  }) as unknown as Stripe.PaymentIntent;
describe("sandbox normalization", () => {
  test("rejects missing, publishable, and live keys", () => {
    for (const key of [undefined, "", "sk_live_secret", "rk_live_secret", "pk_test_public"])
      expect(() => assertSandboxKey(key)).toThrow("sandbox");
    expect(() => assertSandboxKey("sk_test_example")).not.toThrow();
    expect(() => assertSandboxKey("rk_test_example")).not.toThrow();
  });
  test("rejects live payments and expanded live objects", () => {
    expect(() => normalizePayment(pi({ livemode: true }))).toThrow("Live payments");
    expect(() => normalizePayment(pi({ latest_charge: { livemode: true } }))).toThrow(
      "Live related",
    );
  });
  test.each([
    ["succeeded", null, "succeeded"],
    ["processing", null, "pending"],
    ["requires_capture", null, "uncaptured"],
    ["requires_payment_method", null, "incomplete"],
    ["requires_action", null, "incomplete"],
    ["requires_confirmation", null, "incomplete"],
    ["requires_payment_method", { code: "card_declined" }, "failed"],
    ["canceled", null, "canceled"],
  ])("maps %s with %s to %s", (status, last_payment_error, expected) => {
    expect(normalizePayment(pi({ status, last_payment_error })).status).toBe(expected);
  });
  test("maps Radar blocks, disputes and refunds from the latest charge", () => {
    const declined = {
      status: "requires_payment_method",
      last_payment_error: { code: "card_declined" },
    };
    const blockedCharge = { ...charge({ status: "failed" }), outcome: { type: "blocked" } };
    expect(normalizePayment(pi({ ...declined, latest_charge: blockedCharge })).status).toBe(
      "blocked",
    );
    const disputed = { ...charge({ amount_refunded: 500 }), disputed: true };
    // A dispute outranks the refund on the same charge.
    expect(normalizePayment(pi({ latest_charge: disputed })).status).toBe("disputed");
    expect(normalizePayment(pi({ latest_charge: charge({ amount_refunded: 500 }) })).status).toBe(
      "refunded",
    );
  });
  test("maps partial refunds, wallet-backed cards, and customer fallback", () => {
    const normalized = normalizePayment(
      pi({
        customer: { id: "cus_deleted", deleted: true },
        latest_charge: {
          amount_refunded: 500,
          livemode: false,
          billing_details: { name: "Test Buyer", email: "test@example.com" },
          payment_method_details: {
            type: "card",
            card: { brand: "visa", last4: "4242", wallet: { type: "apple_pay" } },
          },
        },
        client_secret: "never-export",
      }),
    );
    expect(normalized).toMatchObject({
      status: "refunded",
      amountRefunded: 500,
      method: "wallet",
      wallet: "apple_pay",
      brand: "visa",
      last4: "4242",
      customer: { name: "Test Buyer", id: "cus_deleted" },
    });
    expect(normalized).not.toHaveProperty("client_secret");
  });
  test("supports ACH and absent details", () => {
    expect(
      normalizePayment(
        pi({
          payment_method: {
            type: "us_bank_account",
            livemode: false,
            us_bank_account: { last4: "6789" },
          },
        }),
      ),
    ).toMatchObject({ method: "ach", last4: "6789" });
    expect(normalizePayment(pi())).toMatchObject({
      method: "other",
      last4: null,
      customer: { name: null, email: null },
    });
  });
});

const charge = (patch: Record<string, unknown> = {}) =>
  ({
    id: "ch_test",
    amount: 2000,
    amount_refunded: 0,
    currency: "usd",
    status: "succeeded",
    captured: true,
    livemode: false,
    created: 1700000000,
    customer: null,
    payment_intent: null,
    billing_details: { name: "Legacy Buyer", email: null },
    payment_method_details: { type: "card", card: { brand: "mastercard", last4: "4795" } },
    receipt_email: "receipt@example.com",
    description: null,
    ...patch,
  }) as unknown as Stripe.Charge;

describe("legacy charge normalization", () => {
  test.each([
    [{ status: "succeeded" }, "succeeded", "succeeded"],
    [{ status: "failed" }, "failed", "failed"],
    [{ status: "pending" }, "pending", "pending"],
    [{ status: "succeeded", captured: false }, "uncaptured", "uncaptured"],
    [{ status: "succeeded", amount_refunded: 500 }, "refunded", "succeeded"],
    [{ status: "succeeded", disputed: true }, "disputed", "succeeded"],
    [{ status: "failed", outcome: { type: "blocked" } }, "blocked", "failed"],
  ])("maps %o to %s", (patch, status, sourceStatus) => {
    expect(normalizeCharge(charge(patch))).toMatchObject({ status, sourceStatus });
  });
  test("reads card, billing and receipt details and rejects live charges", () => {
    expect(normalizeCharge(charge())).toMatchObject({
      id: "ch_test",
      method: "card",
      brand: "mastercard",
      last4: "4795",
      customer: { name: "Legacy Buyer", email: "receipt@example.com" },
    });
    expect(() => normalizeCharge(charge({ livemode: true }))).toThrow("Live payments");
  });
});

describe("customer contact cleanup", () => {
  test("treats an email typed into the billing name as the email", () => {
    expect(
      normalizeCharge(
        charge({
          billing_details: { name: "buyer@example.com", email: null },
          receipt_email: null,
        }),
      ).customer,
    ).toMatchObject({ name: null, email: "buyer@example.com" });
  });
  test("keeps a known email and drops the email-shaped name", () => {
    expect(
      normalizeCharge(
        charge({
          billing_details: { name: "old@example.com", email: "real@example.com" },
          receipt_email: null,
        }),
      ).customer,
    ).toMatchObject({ name: null, email: "real@example.com" });
  });
  test("leaves ordinary names alone", () => {
    expect(normalizeCharge(charge()).customer).toMatchObject({ name: "Legacy Buyer" });
  });
});

describe("payment details", () => {
  test("reads card checks, fees, risk, descriptor, metadata and a dated timeline", () => {
    const latest = {
      ...charge({ created: 1700000005, calculated_statement_descriptor: "CRAMLY.AI" }),
      balance_transaction: { fee: 89, available_on: 1700524800 },
      outcome: { type: "authorized", risk_level: "normal", risk_score: 12 },
      payment_method_details: {
        type: "card",
        card: {
          brand: "visa",
          last4: "4242",
          funding: "credit",
          exp_month: 12,
          exp_year: 2032,
          fingerprint: "FH40CWe8laEq7lbY",
          country: "US",
          checks: { cvc_check: "pass" },
          issuer: "Stripe Payments UK Limited",
        },
      },
    };
    const normalized = normalizePayment(
      pi({ latest_charge: latest, metadata: { order_id: "o_1" } }),
    );
    expect(normalized).toMatchObject({
      card: {
        funding: "credit",
        expMonth: 12,
        expYear: 2032,
        fingerprint: "FH40CWe8laEq7lbY",
        country: "US",
        cvcCheck: "pass",
        issuer: "Stripe Payments UK Limited",
      },
      fee: 89,
      availableOn: 1700524800,
      statementDescriptor: "CRAMLY.AI",
      riskLevel: "normal",
      riskScore: 12,
      metadata: { order_id: "o_1" },
      failureMessage: null,
      events: [
        { type: "created", created: 1700000000 },
        { type: "succeeded", created: 1700000005 },
      ],
    });
  });

  test("keeps decline reasons, Radar messages and cancellation times, and drops unknown values", () => {
    const declined = normalizePayment(
      pi({
        status: "requires_payment_method",
        last_payment_error: { code: "card_declined", message: "Your card was declined." },
      }),
    );
    expect(declined.failureMessage).toBe("Your card was declined.");
    const blocked = normalizeCharge(
      charge({
        status: "failed",
        outcome: { type: "blocked", seller_message: "Blocked by Radar", risk_level: "highest" },
      }),
    );
    expect(blocked).toMatchObject({ failureMessage: "Blocked by Radar", riskLevel: "highest" });
    const canceled = normalizePayment(pi({ status: "canceled", canceled_at: 1700003600 }));
    expect(canceled.events.at(-1)).toEqual({ type: "canceled", created: 1700003600 });
    const unassessed = normalizeCharge(
      charge({
        outcome: { type: "authorized", risk_level: "not_assessed" },
        payment_method_details: { type: "card", card: { checks: { cvc_check: "bogus" } } },
      }),
    );
    expect(unassessed).toMatchObject({ riskLevel: null, card: { cvcCheck: null } });
  });

  test("reads the bank name for ACH debits", () => {
    const ach = normalizeCharge(
      charge({
        payment_method_details: {
          type: "us_bank_account",
          us_bank_account: { last4: "6789", bank_name: "STRIPE TEST BANK" },
        },
      }),
    );
    expect(ach).toMatchObject({ method: "ach", bankName: "STRIPE TEST BANK", card: null });
  });
});
