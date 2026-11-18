// @vitest-environment node
import { expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));
const request = vi.hoisted(() => ({
  headers: new Headers(),
  cookies: new Map<string, string>(),
}));
vi.mock("next/headers", () => ({
  headers: async () => request.headers,
  cookies: async () => ({
    get: (name: string) =>
      request.cookies.has(name) ? { name, value: request.cookies.get(name) } : undefined,
  }),
}));

const { getFormatSettings, preferredLocale, resolveFormatSettings, validTimeZone } =
  await import("./format-settings");

test("picks the highest-weighted supported Accept-Language tag", () => {
  expect(preferredLocale("fr-CH, fr;q=0.9, en;q=0.8")).toBe("fr-CH");
  expect(preferredLocale("en;q=0.5, pt-BR;q=0.9")).toBe("pt-BR");
  expect(preferredLocale("*, de;q=0.1")).toBe("de");
});

test("ignores malformed, oversized and zero-weight tags", () => {
  expect(preferredLocale("not a locale!!, es;q=0.4")).toBe("es");
  expect(preferredLocale(`${"x".repeat(40)}, it`)).toBe("it");
  expect(preferredLocale("ja;q=0")).toBeNull();
  expect(preferredLocale(null)).toBeNull();
});

test("accepts only IANA time zones the runtime knows", () => {
  expect(validTimeZone("America/Sao_Paulo")).toBe("America/Sao_Paulo");
  expect(validTimeZone("Mars/Olympus")).toBeNull();
  expect(validTimeZone("")).toBeNull();
});

test("prefers the browser's cookie, then the IP time zone, then UTC and en-US", () => {
  expect(
    resolveFormatSettings({
      acceptLanguage: "pt-BR",
      timeZoneCookie: "America/Sao_Paulo",
      ipTimeZone: "Europe/Lisbon",
    }),
  ).toEqual({ locale: "pt-BR", timeZone: "America/Sao_Paulo" });
  expect(
    resolveFormatSettings({
      acceptLanguage: null,
      timeZoneCookie: "bogus",
      ipTimeZone: "Europe/Lisbon",
    }),
  ).toEqual({ locale: "en-US", timeZone: "Europe/Lisbon" });
  expect(
    resolveFormatSettings({ acceptLanguage: "", timeZoneCookie: undefined, ipTimeZone: null }),
  ).toEqual({ locale: "en-US", timeZone: "UTC" });
});

test("reads the settings from the request headers and cookies", async () => {
  request.headers = new Headers({
    "accept-language": "de-DE,de;q=0.9",
    "x-vercel-ip-timezone": "Europe/Berlin",
  });
  expect(await getFormatSettings()).toEqual({ locale: "de-DE", timeZone: "Europe/Berlin" });
  request.headers = new Headers({ "accept-language": "de-DE", "cf-timezone": "Europe/Vienna" });
  expect(await getFormatSettings()).toEqual({ locale: "de-DE", timeZone: "Europe/Vienna" });
  request.cookies.set("tz", "Asia/Tokyo");
  expect(await getFormatSettings()).toEqual({ locale: "de-DE", timeZone: "Asia/Tokyo" });
});
