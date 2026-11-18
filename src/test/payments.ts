// Test data shared by the payments unit tests.
import fixture from "../../data/payments.fixture.json";
import { snapshotSchema, type Payment } from "@/features/payments/model";

export const fixtureSnapshot = snapshotSchema.parse(fixture);

/** 2026-11-17 23:00 in Brasília (UTC−3), the "now" the date tests reason about. */
export const testNow = Date.parse("2026-11-18T02:00:00Z") / 1000;

/** A valid payment based on the first fixture row, with the given overrides. */
export function buildPayment(overrides: Partial<Payment> = {}): Payment {
  return {
    ...fixtureSnapshot.payments[0],
    id: "pi_test",
    amount: 1000,
    currency: "usd",
    created: testNow,
    status: "succeeded",
    ...overrides,
  };
}

/** Unix seconds for an ISO timestamp. */
export function secondsAt(iso: string) {
  return Date.parse(iso) / 1000;
}
