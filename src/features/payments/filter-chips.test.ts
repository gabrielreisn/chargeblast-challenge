import { expect, test } from "vitest";
import { testFormatters } from "@/test/payments";
import { getFilterChips, hasActiveFilters } from "./filter-chips";
import { defaultQuery } from "./url-state";

const chips = (patch: Partial<typeof defaultQuery>) =>
  getFilterChips({ ...defaultQuery, ...patch }, testFormatters);

test("has no chips and no active filters for the default query, even with a search", () => {
  expect(chips({ search: "pi_123" })).toEqual([]);
  expect(hasActiveFilters({ ...defaultQuery, search: "pi_123" })).toBe(false);
  expect(hasActiveFilters({ ...defaultQuery, currency: "usd" })).toBe(true);
});

test("labels each chip with its filter and lists them in toolbar order", () => {
  expect(
    chips({
      methods: ["card"],
      statuses: ["failed", "pending"],
      currency: "usd",
      min: "1234.5",
      date: "7",
    }).map((chip) => chip.label),
  ).toEqual([
    "Date: Last 7 days",
    "Amount: ≥ 1,234.5 USD",
    "Currency: USD",
    "Status: Failed",
    "Status: Pending",
    "Payment method: Card",
  ]);
});

test("formats custom dates and amount bounds in the viewer's locale", () => {
  expect(chips({ date: "custom", from: "2026-11-01", to: "2026-11-17" })[0].label).toBe(
    "Date: Nov 1, 2026 – Nov 17, 2026",
  );
  expect(chips({ date: "custom", from: "2026-11-01" })[0].label).toBe("Date: Nov 1, 2026 – Any");
  expect(chips({ max: "50" })[0].label).toBe("Amount: ≤ 50");
  expect(chips({ min: "10", max: "1000000" })[0].label).toBe("Amount: 10 – 1,000,000");
});

test("removes a single value from multi-select filters and whole groups otherwise", () => {
  const [failed, pending] = chips({ statuses: ["failed", "pending"] });
  expect(failed.key).toBe("status:failed");
  expect(failed.reset).toEqual({ statuses: ["pending"] });
  expect(pending.reset).toEqual({ statuses: ["failed"] });
  expect(chips({ date: "today" })[0].reset).toEqual({ date: "", from: "", to: "" });
  expect(chips({ methods: ["ach", "card"] })[1].reset).toEqual({ methods: ["ach"] });
});
