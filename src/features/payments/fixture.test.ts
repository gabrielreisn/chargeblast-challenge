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
  // Guard against committing real customer data.
  expect(payments.every((p) => p.customer.email?.endsWith("@example.com"))).toBe(true);
});
