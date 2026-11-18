import "server-only";
import { cookies, headers } from "next/headers";
import { TIME_ZONE_COOKIE, type FormatSettings } from "@/features/payments/format";

/** Hosts that geolocate the visitor's IP and forward its time zone, in order of preference. */
const ipTimeZoneHeaders = ["x-vercel-ip-timezone", "cf-timezone"];

const fallback: FormatSettings = { locale: "en-US", timeZone: "UTC" };
const MAX_LOCALE_LENGTH = 35;

/** The highest-weighted `Accept-Language` tag the runtime supports, or `null`. */
export function preferredLocale(acceptLanguage: string | null) {
  const tags = (acceptLanguage ?? "")
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const quality = params.find((param) => param.trim().startsWith("q="));
      return { tag: tag.trim(), q: quality ? Number(quality.trim().slice(2)) : 1, index };
    })
    .filter(({ tag, q }) => tag && tag !== "*" && tag.length <= MAX_LOCALE_LENGTH && q > 0)
    .toSorted((a, b) => b.q - a.q || a.index - b.index);
  for (const { tag } of tags) {
    try {
      const [supported] = Intl.DateTimeFormat.supportedLocalesOf(tag);
      if (supported) return supported;
    } catch {
      // Malformed tag (the header is client-controlled); try the next one.
    }
  }
  return null;
}

/** `value` when it names an IANA time zone this runtime knows, otherwise `null`. */
export function validTimeZone(value: string | null | undefined) {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: value }).resolvedOptions().timeZone;
  } catch {
    return null;
  }
}

type FormatSettingsSources = {
  acceptLanguage: string | null;
  /** Set by the browser (`TimeZoneSync`) once it has reported its own zone. */
  timeZoneCookie: string | undefined;
  /**
   * The host's IP-geolocated zone (Vercel's `x-vercel-ip-timezone`, or Cloudflare's `cf-timezone`
   * with visitor location headers on): a good first guess before the browser has reported.
   */
  ipTimeZone: string | null;
};

export function resolveFormatSettings({
  acceptLanguage,
  timeZoneCookie,
  ipTimeZone,
}: FormatSettingsSources): FormatSettings {
  return {
    locale: preferredLocale(acceptLanguage) ?? fallback.locale,
    timeZone: validTimeZone(timeZoneCookie) ?? validTimeZone(ipTimeZone) ?? fallback.timeZone,
  };
}

/** The viewer's locale and time zone for this request. Reading them makes the route dynamic. */
export async function getFormatSettings() {
  const [headerList, cookieStore] = await Promise.all([headers(), cookies()]);
  return resolveFormatSettings({
    acceptLanguage: headerList.get("accept-language"),
    timeZoneCookie: cookieStore.get(TIME_ZONE_COOKIE)?.value,
    ipTimeZone: ipTimeZoneHeaders.map((name) => headerList.get(name)).find(Boolean) ?? null,
  });
}
