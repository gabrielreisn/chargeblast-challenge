import { describe, expect, test } from "vitest";
import { snapshotSchema, type Payment } from "./model";
import fixture from "../../../data/payments.fixture.json";
import {
  csvForPayments,
  dateKey,
  defaultQuery,
  formatAmount,
  majorAmount,
  parseQuery,
  queryPayments,
  serializeQuery,
} from "./query";
const data = snapshotSchema.parse(fixture);
const now = Date.parse("2026-11-18T02:00:00Z") / 1000;
const payment = (patch: Partial<Payment> = {}): Payment => ({
  ...data.payments[0],
  id: "pi_test",
  amount: 1000,
  currency: "usd",
  created: now,
  status: "succeeded",
  ...patch,
});

describe("currency and date formatting", () => {
  test("preserves integer minor units for USD and zero-decimal JPY", () => {
    expect(majorAmount(1234, "usd")).toBe(12.34);
    expect(majorAmount(1234, "jpy")).toBe(1234);
    expect(formatAmount(1234, "usd")).toBe("$12.34");
    expect(formatAmount(1234, "jpy")).toBe("¥1,234");
  });
  test("uses Brasília calendar dates, including midnight boundaries", () => {
    expect(dateKey(now)).toBe("2026-11-17");
    const records = [
      payment({ id: "start", created: Date.parse("2026-11-17T03:00Z") / 1000 }),
      payment({ id: "before", created: Date.parse("2026-11-17T02:59:59Z") / 1000 }),
      payment({ id: "end", created: Date.parse("2026-11-18T02:59:59Z") / 1000 }),
      payment({ id: "after", created: Date.parse("2026-11-18T03:00Z") / 1000 }),
    ];
    expect(
      queryPayments(records, { ...defaultQuery, date: "today" }, now).map((p) => p.id),
    ).toEqual(["end", "start"]);
    expect(
      queryPayments(
        records,
        { ...defaultQuery, date: "custom", from: "2026-11-17", to: "2026-11-17" },
        now,
      ),
    ).toHaveLength(2);
  });
  test("includes exactly seven calendar days for the seven-day preset", () => {
    const records = [
      payment({ id: "inside", created: Date.parse("2026-11-11T03:00Z") / 1000 }),
      payment({ id: "outside", created: Date.parse("2026-11-11T02:59:59Z") / 1000 }),
    ];
    expect(queryPayments(records, { ...defaultQuery, date: "7" }, now).map((p) => p.id)).toEqual([
      "inside",
    ]);
  });
});
describe("query pipeline", () => {
  test("combines filter groups with AND and multi-select values with OR", () => {
    const records = [
      payment({ id: "a", method: "card", status: "succeeded" }),
      payment({ id: "b", method: "wallet", status: "pending" }),
      payment({ id: "c", method: "ach", status: "succeeded" }),
      payment({ id: "d", method: "card", status: "failed" }),
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
        now,
      ).map((p) => p.id),
    ).toEqual(["a", "b"]);
  });
  test("searches full IDs, case-insensitive email, and last four digits", () => {
    const p = payment({
      id: "pi_SecretEnding",
      customer: { id: null, name: null, email: "Alex@example.com" },
      last4: "4242",
    });
    for (const search of ["secretending", " ALEX@EXAMPLE.COM ", "4242"])
      expect(queryPayments([p], { ...defaultQuery, search }, now)).toHaveLength(1);
    expect(queryPayments([p], { ...defaultQuery, search: "missing" }, now)).toHaveLength(0);
  });
  test("sorts displayed amounts across currency precision and breaks ties by ID", () => {
    const records = [
      payment({ id: "z", amount: 1000 }),
      payment({ id: "a", amount: 10, currency: "jpy" }),
      payment({ id: "c", amount: 2000 }),
    ];
    expect(
      queryPayments(records, { ...defaultQuery, sort: "amount", direction: "asc" }, now).map(
        (p) => p.id,
      ),
    ).toEqual(["a", "z", "c"]);
  });
  test("round-trips shared URLs and ignores malformed inputs without crashing", () => {
    const query = {
      ...defaultQuery,
      statuses: ["failed", "pending"] as Payment["status"][],
      page: 3,
      size: 50 as const,
      min: "1.25",
    };
    expect(parseQuery(new URLSearchParams(serializeQuery(query)))).toEqual(query);
    expect(
      parseQuery(
        new URLSearchParams("from=2026-99-99&size=999&page=-3&status=bogus&sort=nope&min=-2"),
      ),
    ).toMatchObject({ from: "", size: 25, page: 1, statuses: [], sort: "created", min: "" });
  });
  test("exports escaped, safe CSV for the entire filtered view", () => {
    const csv = csvForPayments([
      payment({ customer: { id: null, name: "x", email: '=SUM(1,2)"@example.com' } }),
    ]);
    expect(csv).toContain('"\'=SUM(1,2)""@example.com"');
    expect(csv.split("\r\n")).toHaveLength(2);
  });
  test("fixture provides assignment-sized coverage without real customer data", () => {
    expect(data.payments).toHaveLength(500);
    expect(new Set(data.payments.map((p) => p.status)).size).toBe(4);
    expect(new Set(data.payments.map((p) => p.currency)).size).toBeGreaterThanOrEqual(4);
    expect(data.payments.every((p) => p.customer.email?.endsWith("@example.com"))).toBe(true);
  });
});
