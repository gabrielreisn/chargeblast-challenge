import { expect, test } from "vitest";
import { testFormatters, testNow } from "@/test/payments";
import { formattersFor, fractionDigitsFor, majorAmount } from "./format";

test("preserves integer minor units for USD and zero-decimal JPY", () => {
  expect(majorAmount(1234, "usd")).toBe(12.34);
  expect(majorAmount(1234, "jpy")).toBe(1234);
  expect(fractionDigitsFor("kwd")).toBe(3);
  expect(testFormatters.formatAmount(1234, "usd")).toBe("$12.34");
  expect(testFormatters.formatAmount(1234, "jpy")).toBe("¥1,234");
});

test("formats amounts, numbers and dates in the viewer's locale", () => {
  const brazil = formattersFor({ locale: "pt-BR", timeZone: "America/Sao_Paulo" });
  // Intl separates the symbol with a no-break space.
  expect(brazil.formatAmount(123_456, "brl")).toBe("R$\u00a01.234,56");
  expect(brazil.formatNumber(1234.5)).toBe("1.234,5");
  expect(brazil.relativeTime(testNow - 86_400, testNow)).toBe("ontem");
  expect(testFormatters.formatCalendarDate("2026-11-03")).toBe("Nov 3, 2026");
});

test("uses the calendar day of the viewer's time zone", () => {
  // 02:00 UTC on Nov 18 is still Nov 17 in Brasília (UTC−3).
  expect(testFormatters.dateKey(testNow)).toBe("2026-11-17");
  expect(formattersFor({ locale: "en-US", timeZone: "UTC" }).dateKey(testNow)).toBe("2026-11-18");
  expect(testFormatters.formatDate(testNow)).toBe("Nov 17, 11:00 PM");
});

test("names the time zone with its offset at a given moment", () => {
  expect(testFormatters.timeZoneLabel(testNow)).toBe("Brasilia Standard Time (GMT-3)");
  const newYork = formattersFor({ locale: "en-US", timeZone: "America/New_York" });
  expect(newYork.timeZoneLabel(Date.parse("2026-07-01T12:00:00Z") / 1000)).toBe(
    "Eastern Daylight Time (GMT-4)",
  );
});

test("formats full dates, times, offsets, expiry and countries for the details page", () => {
  expect(testFormatters.formatFullDate(testNow)).toBe("Nov 17, 2026, 11:00 PM");
  expect(testFormatters.formatTime(testNow)).toBe("11:00 PM");
  expect(testFormatters.formatDay(testNow)).toBe("Nov 17, 2026");
  expect(testFormatters.offsetLabel(testNow)).toBe("-03");
  expect(formattersFor({ locale: "en-US", timeZone: "Asia/Kolkata" }).offsetLabel(testNow)).toBe(
    "+05:30",
  );
  expect(formattersFor({ locale: "en-US", timeZone: "UTC" }).offsetLabel(testNow)).toBe("+00");
  expect(testFormatters.formatExpiry(12, 2032)).toBe("Dec 2032");
  expect(testFormatters.regionName("JP")).toBe("Japan");
});

test("reuses one set of formatters per locale and time zone", () => {
  expect(formattersFor({ locale: "en-US", timeZone: "America/Sao_Paulo" })).toBe(testFormatters);
});

test("describes relative time with the largest fitting unit", () => {
  expect(testFormatters.relativeTime(testNow - 120, testNow)).toBe("2 minutes ago");
  expect(testFormatters.relativeTime(testNow - 3 * 3600, testNow)).toBe("3 hours ago");
  expect(testFormatters.relativeTime(testNow - 86_400, testNow)).toBe("yesterday");
});
