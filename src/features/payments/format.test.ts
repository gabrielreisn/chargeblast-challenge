import { expect, test } from "vitest";
import { testNow } from "@/test/payments";
import { dateKey, formatAmount, majorAmount, relativeTime } from "./format";

test("preserves integer minor units for USD and zero-decimal JPY", () => {
  expect(majorAmount(1234, "usd")).toBe(12.34);
  expect(majorAmount(1234, "jpy")).toBe(1234);
  expect(formatAmount(1234, "usd")).toBe("$12.34");
  expect(formatAmount(1234, "jpy")).toBe("¥1,234");
});

test("uses the Brasília calendar day", () => {
  // 02:00 UTC on Nov 18 is still Nov 17 in Brasília (UTC−3).
  expect(dateKey(testNow)).toBe("2026-11-17");
});

test("describes relative time with the largest fitting unit", () => {
  expect(relativeTime(testNow - 120, testNow)).toBe("2 minutes ago");
  expect(relativeTime(testNow - 3 * 3600, testNow)).toBe("3 hours ago");
  expect(relativeTime(testNow - 86_400, testNow)).toBe("yesterday");
});
