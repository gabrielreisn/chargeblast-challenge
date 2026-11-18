import { dateKey, majorAmount } from "./format";
import type { Payment } from "./model";
import type { PaymentQuery } from "./url-state";

const SECONDS_PER_DAY = 86_400;

type DateRange = { start: string; end: string };

/**
 * Inclusive calendar-day range for the date filter. Presets count today, so
 * "7" covers today plus the six previous days.
 */
function dateRangeFor(query: PaymentQuery, now: number): DateRange {
  if (query.date === "custom") return { start: query.from, end: query.to };
  const extraDays = query.date === "7" ? 6 : query.date === "30" ? 29 : 0;
  return { start: dateKey(now - extraDays * SECONDS_PER_DAY), end: dateKey(now) };
}

/** Case-insensitive match on the full ID and email; literal match on the last 4 digits. */
function matchesSearch(payment: Payment, term: string) {
  if (!term) return true;
  return [payment.id, payment.customer.email ?? "", payment.last4 ?? ""].some((value) =>
    value.toLowerCase().includes(term),
  );
}

function matchesDate(payment: Payment, query: PaymentQuery, { start, end }: DateRange) {
  if (!query.date) return true;
  const day = dateKey(payment.created);
  return (!start || day >= start) && (!end || day <= end);
}

/** Amounts compare in displayed major units, without currency conversion. */
function matchesAmount(payment: Payment, query: PaymentQuery) {
  const amount = majorAmount(payment.amount, payment.currency);
  return (!query.min || amount >= Number(query.min)) && (!query.max || amount <= Number(query.max));
}

function compareBy(field: PaymentQuery["sort"], a: Payment, b: Payment) {
  if (field === "created") return a.created - b.created;
  if (field === "amount")
    return majorAmount(a.amount, a.currency) - majorAmount(b.amount, b.currency);
  return a.status.localeCompare(b.status);
}

/**
 * Applies search and every active filter, then a stable sort. Filter groups
 * combine with AND; values inside a multi-select combine with OR. Ties break
 * by ID so the order never shuffles between renders.
 */
export function queryPayments(payments: Payment[], query: PaymentQuery, now: number) {
  const term = query.search.trim().toLowerCase();
  const dateRange = dateRangeFor(query, now);
  return payments
    .filter(
      (payment) =>
        matchesSearch(payment, term) &&
        (!query.statuses.length || query.statuses.includes(payment.status)) &&
        (!query.methods.length || query.methods.includes(payment.method)) &&
        (!query.currency || query.currency === payment.currency) &&
        matchesDate(payment, query, dateRange) &&
        matchesAmount(payment, query),
    )
    .toSorted((a, b) => {
      const difference = compareBy(query.sort, a, b);
      return (query.direction === "asc" ? difference : -difference) || a.id.localeCompare(b.id);
    });
}
