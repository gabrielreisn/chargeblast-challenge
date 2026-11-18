/** Every date in the dashboard is shown and filtered in this time zone. */
export const TIME_ZONE = "America/Sao_Paulo";

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86_400;

const currencyFormatters = new Map<string, Intl.NumberFormat>();

function currencyFormatter(currency: string) {
  let formatter = currencyFormatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    });
    currencyFormatters.set(currency, formatter);
  }
  return formatter;
}

/** Calendar day (YYYY-MM-DD) in the dashboard time zone; "en-CA" formats as ISO dates. */
const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** Converts integer minor units to major units, respecting zero-decimal currencies (JPY). */
export function majorAmount(amount: number, currency: string) {
  const digits = currencyFormatter(currency).resolvedOptions().maximumFractionDigits ?? 2;
  return amount / 10 ** digits;
}

export function formatAmount(amount: number, currency: string) {
  return currencyFormatter(currency).format(majorAmount(amount, currency));
}

/** Unix seconds → YYYY-MM-DD in the dashboard time zone. */
export function dateKey(timestamp: number) {
  return dayFormatter.format(new Date(timestamp * 1000));
}

/** Unix seconds → "Nov 18, 2:05 PM" in the dashboard time zone. */
export function formatDate(timestamp: number) {
  return dateTimeFormatter.format(new Date(timestamp * 1000));
}

/** "3 hours ago", "yesterday", … using the largest unit that fits. */
export function relativeTime(timestamp: number, now: number) {
  const seconds = timestamp - now;
  const distance = Math.abs(seconds);
  if (distance >= SECONDS_PER_DAY)
    return relativeFormatter.format(Math.round(seconds / SECONDS_PER_DAY), "day");
  if (distance >= SECONDS_PER_HOUR)
    return relativeFormatter.format(Math.round(seconds / SECONDS_PER_HOUR), "hour");
  return relativeFormatter.format(Math.round(seconds / SECONDS_PER_MINUTE), "minute");
}
