import { expect, test } from "vitest";
import { fixtureSnapshot } from "@/test/payments";
import { statuses } from "./model";

test("fixture provides assignment-sized coverage without real customer data", () => {
  const { payments } = fixtureSnapshot;
  expect(payments).toHaveLength(500);
  // Every status except uncaptured, which is left empty to exercise the empty status view.
  expect(new Set(payments.map((p) => p.status))).toEqual(
    new Set(statuses.filter((status) => status !== "uncaptured")),
  );
  expect(new Set(payments.map((p) => p.currency)).size).toBeGreaterThanOrEqual(4);
  // Captured payments carry a fee and a payout date; every timeline starts at creation.
  const captured = payments.filter((p) => ["succeeded", "refunded", "disputed"].includes(p.status));
  expect(captured.every((p) => p.fee !== null && p.availableOn !== null)).toBe(true);
  expect(
    payments.every((p) => p.events[0].type === "created" && p.events[0].created === p.created),
  ).toBe(true);
  expect(payments.filter((p) => p.status === "failed").every((p) => p.failureMessage)).toBe(true);
  // Guard against committing real customer data.
  expect(payments.every((p) => p.customer.email?.endsWith("@example.com"))).toBe(true);
});
