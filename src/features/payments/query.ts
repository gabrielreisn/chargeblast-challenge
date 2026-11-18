import { methods, statuses, type Payment, type PaymentMethod, type PaymentStatus } from "./model";

export const TIME_ZONE = "America/Sao_Paulo";
export type PaymentQuery = {
  search: string;
  statuses: PaymentStatus[];
  methods: PaymentMethod[];
  currency: string;
  date: string;
  from: string;
  to: string;
  min: string;
  max: string;
  sort: "created" | "amount" | "status";
  direction: "asc" | "desc";
  page: number;
  size: 25 | 50 | 100;
};
export const defaultQuery: PaymentQuery = {
  search: "",
  statuses: [],
  methods: [],
  currency: "",
  date: "",
  from: "",
  to: "",
  min: "",
  max: "",
  sort: "created",
  direction: "desc",
  page: 1,
  size: 25,
};
const validDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(new Date(value).valueOf()) &&
  new Date(value).toISOString().slice(0, 10) === value;
const amountBound = (value: string | null) =>
  value && /^\d+(\.\d{1,3})?$/.test(value) && Number.isFinite(Number(value)) ? value : "";
const statusSet = new Set<string>(statuses);
const methodSet = new Set<string>(methods);
export function parseQuery(params: URLSearchParams): PaymentQuery {
  const from = params.get("from") ?? "",
    to = params.get("to") ?? "";
  const min = amountBound(params.get("min")),
    max = amountBound(params.get("max"));
  return {
    ...defaultQuery,
    search: (params.get("q") ?? "").slice(0, 200),
    statuses: (params.get("status")?.split(",") ?? []).filter((v): v is PaymentStatus =>
      statusSet.has(v),
    ),
    methods: (params.get("method")?.split(",") ?? []).filter((v): v is PaymentMethod =>
      methodSet.has(v),
    ),
    currency: /^[a-z]{3}$/.test(params.get("currency") ?? "") ? params.get("currency")! : "",
    date: ["today", "7", "30", "custom"].includes(params.get("date") ?? "")
      ? params.get("date")!
      : "",
    from: validDate(from) ? from : "",
    to: validDate(to) ? to : "",
    min: min && max && Number(min) > Number(max) ? "" : min,
    max: min && max && Number(min) > Number(max) ? "" : max,
    sort: ["amount", "status"].includes(params.get("sort") ?? "")
      ? (params.get("sort") as "amount" | "status")
      : "created",
    direction: params.get("direction") === "asc" ? "asc" : "desc",
    page: Math.min(100000, Math.max(1, Math.floor(Number(params.get("page")) || 1))),
    size: [25, 50, 100].includes(Number(params.get("size")))
      ? (Number(params.get("size")) as 25 | 50 | 100)
      : 25,
  };
}
export function serializeQuery(query: PaymentQuery) {
  const params = new URLSearchParams();
  const fields = {
    q: query.search,
    status: query.statuses.join(","),
    method: query.methods.join(","),
    currency: query.currency,
    date: query.date,
    from: query.from,
    to: query.to,
    min: query.min,
    max: query.max,
    sort: query.sort === "created" ? "" : query.sort,
    direction: query.direction === "desc" ? "" : query.direction,
    page: query.page > 1 ? String(query.page) : "",
    size: query.size === 25 ? "" : String(query.size),
  };
  for (const [key, value] of Object.entries(fields)) if (value) params.set(key, value);
  return params.toString();
}
/** URL of the payments list for a query; omits default values. */
export function paymentsHref(query: PaymentQuery) {
  const search = serializeQuery(query);
  return `/payments${search ? `?${search}` : ""}`;
}
const formatters = new Map<string, Intl.NumberFormat>();
function currencyFormatter(currency: string) {
  let formatter = formatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    });
    formatters.set(currency, formatter);
  }
  return formatter;
}
const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
export function majorAmount(amount: number, currency: string) {
  const digits = currencyFormatter(currency).resolvedOptions().maximumFractionDigits ?? 2;
  return amount / 10 ** digits;
}
export function formatAmount(amount: number, currency: string) {
  return currencyFormatter(currency).format(majorAmount(amount, currency));
}
export function dateKey(timestamp: number) {
  return dayFormatter.format(new Date(timestamp * 1000));
}
const fullDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
export function formatDate(timestamp: number) {
  return fullDateFormatter.format(new Date(timestamp * 1000));
}
export function relativeTime(timestamp: number, now: number) {
  const seconds = timestamp - now;
  const unit = Math.abs(seconds) >= 86400 ? "day" : Math.abs(seconds) >= 3600 ? "hour" : "minute";
  return relativeFormatter.format(
    Math.round(seconds / (unit === "day" ? 86400 : unit === "hour" ? 3600 : 60)),
    unit,
  );
}
export function queryPayments(payments: Payment[], query: PaymentQuery, now: number) {
  const selectedStatuses = new Set(query.statuses),
    selectedMethods = new Set(query.methods);
  const today = dateKey(now);
  const days = query.date === "7" ? 6 : query.date === "30" ? 29 : 0;
  const start = query.date === "custom" ? query.from : dateKey(now - days * 86400);
  const end = query.date === "custom" ? query.to : today;
  const term = query.search.trim().toLowerCase();
  return payments
    .filter((p) => {
      const amount = majorAmount(p.amount, p.currency),
        day = dateKey(p.created);
      return (
        (!term ||
          [p.id, p.customer.email ?? "", p.last4 ?? ""].some((v) =>
            v.toLowerCase().includes(term),
          )) &&
        (!query.statuses.length || selectedStatuses.has(p.status)) &&
        (!query.methods.length || selectedMethods.has(p.method)) &&
        (!query.currency || query.currency === p.currency) &&
        (!query.date || ((!start || day >= start) && (!end || day <= end))) &&
        (!query.min || amount >= Number(query.min)) &&
        (!query.max || amount <= Number(query.max))
      );
    })
    .toSorted((a, b) => {
      const difference =
        query.sort === "created"
          ? a.created - b.created
          : query.sort === "amount"
            ? majorAmount(a.amount, a.currency) - majorAmount(b.amount, b.currency)
            : a.status.localeCompare(b.status);
      return (query.direction === "asc" ? difference : -difference) || a.id.localeCompare(b.id);
    });
}
/** Quotes a CSV field and neutralizes spreadsheet formula prefixes (=, +, @, -). */
function escapeCsvField(value: string) {
  return `"${(/^[=+@\-\t\r\n]/.test(value) ? "'" : "") + value.replaceAll('"', '""')}"`;
}
export function csvForPayments(payments: Payment[]) {
  return [
    [
      "Payment ID",
      "Customer",
      "Amount",
      "Currency",
      "Status",
      "Payment method",
      "Last 4",
      "Created",
    ],
    ...payments.map((p) => [
      p.id,
      p.customer.email ?? p.customer.name ?? "",
      String(majorAmount(p.amount, p.currency)),
      p.currency.toUpperCase(),
      p.status,
      p.method,
      p.last4 ?? "",
      new Date(p.created * 1000).toISOString(),
    ]),
  ]
    .map((row) => row.map(escapeCsvField).join(","))
    .join("\r\n");
}
