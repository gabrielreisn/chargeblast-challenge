import { describe, expect, test } from "vitest";
import { buildPayment, secondsAt, testFormatters, testNow } from "@/test/payments";
import { queryPayments } from "./query-payments";
import { defaultQuery } from "./url-state";

describe("date filtering", () => {
  test("uses Brasília calendar dates, including midnight boundaries", () => {
    const records = [
      buildPayment({ id: "start", created: secondsAt("2026-11-17T03:00Z") }),
      buildPayment({ id: "before", created: secondsAt("2026-11-17T02:59:59Z") }),
      buildPayment({ id: "end", created: secondsAt("2026-11-18T02:59:59Z") }),
      buildPayment({ id: "after", created: secondsAt("2026-11-18T03:00Z") }),
    ];
    expect(
      queryPayments(records, { ...defaultQuery, date: "today" }, testNow, testFormatters).map(
        (p) => p.id,
      ),
    ).toEqual(["end", "start"]);
    expect(
      queryPayments(
        records,
        { ...defaultQuery, date: "custom", from: "2026-11-17", to: "2026-11-17" },
        testNow,
        testFormatters,
      ),
    ).toHaveLength(2);
  });

  test("includes exactly seven calendar days for the seven-day preset", () => {
    const records = [
      buildPayment({ id: "inside", created: secondsAt("2026-11-11T03:00Z") }),
      buildPayment({ id: "outside", created: secondsAt("2026-11-11T02:59:59Z") }),
    ];
    expect(
      queryPayments(records, { ...defaultQuery, date: "7" }, testNow, testFormatters).map(
        (p) => p.id,
      ),
    ).toEqual(["inside"]);
  });
});

describe("filters, search and sorting", () => {
  test("combines filter groups with AND and multi-select values with OR", () => {
    const records = [
      buildPayment({ id: "a", method: "card", status: "succeeded" }),
      buildPayment({ id: "b", method: "wallet", status: "pending" }),
      buildPayment({ id: "c", method: "ach", status: "succeeded" }),
      buildPayment({ id: "d", method: "card", status: "failed" }),
    ];
    expect(
      queryPayments(
        records,
        {
          ...defaultQuery,
          statuses: ["succeeded", "pending"],
          methods: ["card", "wallet"],
          min: "10",
          max: "10",
        },
        testNow,
        testFormatters,
      ).map((p) => p.id),
    ).toEqual(["a", "b"]);
  });

  test("searches full IDs, case-insensitive email, and last four digits", () => {
    const payment = buildPayment({
      id: "pi_SecretEnding",
      customer: { id: null, name: null, email: "Alex@example.com" },
      last4: "4242",
    });
    for (const search of ["secretending", " ALEX@EXAMPLE.COM ", "4242"])
      expect(
        queryPayments([payment], { ...defaultQuery, search }, testNow, testFormatters),
      ).toHaveLength(1);
    expect(
      queryPayments([payment], { ...defaultQuery, search: "missing" }, testNow, testFormatters),
    ).toHaveLength(0);
  });

  test("sorts displayed amounts across currency precision and breaks ties by ID", () => {
    const records = [
      buildPayment({ id: "z", amount: 1000 }),
      buildPayment({ id: "a", amount: 10, currency: "jpy" }),
      buildPayment({ id: "c", amount: 2000 }),
    ];
    expect(
      queryPayments(
        records,
        { ...defaultQuery, sort: "amount", direction: "asc" },
        testNow,
        testFormatters,
      ).map((p) => p.id),
    ).toEqual(["a", "z", "c"]);
  });
});
