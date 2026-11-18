import { expect, test } from "vitest";
import { fixtureSnapshot } from "@/test/payments";

test("fixture provides assignment-sized coverage without real customer data", () => {
  const { payments } = fixtureSnapshot;
  expect(payments).toHaveLength(500);
  expect(new Set(payments.map((p) => p.status)).size).toBe(4);
  expect(new Set(payments.map((p) => p.currency)).size).toBeGreaterThanOrEqual(4);
  // Guard against committing real customer data.
  expect(payments.every((p) => p.customer.email?.endsWith("@example.com"))).toBe(true);
});
