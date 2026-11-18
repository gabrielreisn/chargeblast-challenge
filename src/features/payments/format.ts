/**
 * Display formatting. Locale and time zone come from the viewer (see `src/lib/format-settings.ts`):
 * the server renders with them and the browser reuses the same values, so markup matches on hydration.
 */
export type FormatSettings = { locale: string; timeZone: string };

/** Cookie holding the browser's IANA time zone, so the server can render in it. */
export const TIME_ZONE_COOKIE = "tz";

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86_400;

/**
 * Minor-unit digits per currency don't depend on the locale, so they are shared by every viewer
 * (filtering, sorting and CSV stay locale-independent).
 */
const fractionDigits = new Map<string, number>();

/** Decimal places a currency uses: 2 for USD, 0 for JPY, 3 for KWD. */
export function fractionDigitsFor(currency: string) {
  let digits = fractionDigits.get(currency);
  if (digits === undefined) {
    digits =
      new Intl.NumberFormat("en-US", { style: "currency", currency }).resolvedOptions()
        .maximumFractionDigits ?? 2;
    fractionDigits.set(currency, digits);
  }
  return digits;
}

/** Converts integer minor units to major units, respecting zero-decimal currencies (JPY). */
export function majorAmount(amount: number, currency: string) {
  return amount / 10 ** fractionDigitsFor(currency);
}

function createFormatters({ locale, timeZone }: FormatSettings) {
  const currencyFormatters = new Map<string, Intl.NumberFormat>();
  function currencyFormatter(currency: string) {
    let formatter = currencyFormatters.get(currency);
    if (!formatter) {
      formatter = new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        currencyDisplay: "narrowSymbol",
      });
      currencyFormatters.set(currency, formatter);
    }
    return formatter;
  }
  // "en-CA" formats as ISO dates (YYYY-MM-DD), which compare as strings; only the zone varies.
  const dayFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dateTimeFormatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  // Calendar dates from the URL are already in the viewer's zone; format them as UTC so they don't shift.
  const calendarDateFormatter = new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const numberFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 3 });
  const zoneNameFormatter = new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: "long" });
  const zoneOffsetFormatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    timeZoneName: "shortOffset",
  });
  const relativeFormatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  return {
    locale,
    timeZone,
    formatAmount(amount: number, currency: string) {
      return currencyFormatter(currency).format(majorAmount(amount, currency));
    },
    /** A plain number in the viewer's locale ("12,345.5"), for amounts without a currency. */
    formatNumber(value: number) {
      return numberFormatter.format(value);
    },
    /** Unix seconds → YYYY-MM-DD in the viewer's time zone. */
    dateKey(timestamp: number) {
      return dayFormatter.format(new Date(timestamp * 1000));
    },
    /** Unix seconds → "Nov 18, 2:05 PM" (in the viewer's locale and time zone). */
    formatDate(timestamp: number) {
      return dateTimeFormatter.format(new Date(timestamp * 1000));
    },
    /** YYYY-MM-DD → "Nov 18, 2026". */
    formatCalendarDate(isoDate: string) {
      return calendarDateFormatter.format(new Date(`${isoDate}T00:00:00Z`));
    },
    /** "Brasilia Standard Time (GMT-3)" at `timestamp`, which picks standard or daylight time. */
    timeZoneLabel(timestamp: number) {
      const date = new Date(timestamp * 1000);
      const part = (formatter: Intl.DateTimeFormat) =>
        formatter.formatToParts(date).find((item) => item.type === "timeZoneName")?.value ?? "";
      return `${part(zoneNameFormatter) || timeZone} (${part(zoneOffsetFormatter)})`;
    },
    /** "3 hours ago", "yesterday", … using the largest unit that fits. */
    relativeTime(timestamp: number, now: number) {
      const seconds = timestamp - now;
      const distance = Math.abs(seconds);
      if (distance >= SECONDS_PER_DAY)
        return relativeFormatter.format(Math.round(seconds / SECONDS_PER_DAY), "day");
      if (distance >= SECONDS_PER_HOUR)
        return relativeFormatter.format(Math.round(seconds / SECONDS_PER_HOUR), "hour");
      return relativeFormatter.format(Math.round(seconds / SECONDS_PER_MINUTE), "minute");
    },
  };
}

export type Formatters = ReturnType<typeof createFormatters>;

// Building Intl formatters is relatively slow and every table cell formats, so keep one set per viewer setting.
const formatterCache = new Map<string, Formatters>();

/** Formatters bound to a locale and time zone, shared by every caller with the same settings. */
export function formattersFor(settings: FormatSettings) {
  const key = `${settings.locale}|${settings.timeZone}`;
  let formatters = formatterCache.get(key);
  if (!formatters) {
    formatters = createFormatters(settings);
    formatterCache.set(key, formatters);
  }
  return formatters;
}
