import { describe, expect, test } from "vitest";
import type Stripe from "stripe";
import { assertSandboxKey, normalizePayment } from "./normalize";
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
    ["requires_capture", null, "pending"],
    ["requires_payment_method", null, "pending"],
    ["requires_payment_method", { code: "card_declined" }, "failed"],
    ["canceled", null, "failed"],
  ])("maps %s with %s to %s", (status, last_payment_error, expected) => {
    expect(normalizePayment(pi({ status, last_payment_error })).status).toBe(expected);
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
