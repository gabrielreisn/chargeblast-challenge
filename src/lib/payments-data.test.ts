// @vitest-environment node
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { Snapshot } from "@/features/payments/model";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ cacheLife: vi.fn<() => void>() }));
const stripeSnapshot: Snapshot = {
  schemaVersion: 1,
  source: "stripe-api",
  importedAt: "2026-11-18T00:00:00.000Z",
  payments: [],
};
const stripe = vi.hoisted(() => ({
  createStripeClient: vi.fn<(key: string | undefined) => object>(() => ({})),
  fetchStripeSnapshot: vi.fn<() => Promise<Snapshot>>(),
}));
vi.mock("@/features/payments/stripe-source", () => stripe);

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test");
  stripe.fetchStripeSnapshot.mockResolvedValue(stripeSnapshot);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

async function load() {
  const { getPaymentsData } = await import("./payments-data");
  return getPaymentsData();
}

test("serves the committed fixture by default without calling Stripe", async () => {
  vi.stubEnv("PAYMENTS_SOURCE", "");
  const snapshot = await load();
  expect(snapshot.source).toBe("synthetic");
  expect(snapshot.payments.length).toBeGreaterThan(300);
  expect(stripe.createStripeClient).not.toHaveBeenCalled();
});

test("fetches from Stripe with the configured key when the source is remote", async () => {
  vi.stubEnv("PAYMENTS_SOURCE", "remote");
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
  await expect(load()).resolves.toBe(stripeSnapshot);
  expect(stripe.createStripeClient).toHaveBeenCalledWith("sk_test_123");
  expect(stripe.fetchStripeSnapshot).toHaveBeenCalledWith(expect.anything(), {
    source: "stripe-api",
  });
});

test("surfaces Stripe and configuration failures to the route error boundary", async () => {
  vi.stubEnv("PAYMENTS_SOURCE", "remote");
  stripe.fetchStripeSnapshot.mockRejectedValue(new Error("Stripe is unavailable"));
  await expect(load()).rejects.toThrow("Stripe is unavailable");
  vi.stubEnv("PAYMENTS_SOURCE", "stripe");
  await expect(load()).rejects.toThrow('Invalid payments source "stripe"');
});
