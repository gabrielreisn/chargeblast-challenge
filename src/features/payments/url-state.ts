import { methods, statuses, type PaymentMethod, type PaymentStatus } from "./model";

// Filters, sorting and pagination live in the URL so views can be shared and
// the browser's back/forward buttons work.

type SortField = "created" | "amount" | "status";

const datePresets = ["today", "7", "30", "custom"] as const;
/** "today", "7" or "30" (days, counting today), or "custom" (uses `from`/`to`). */
export type DatePreset = (typeof datePresets)[number];
type PageSize = 25 | 50 | 100;

export type PaymentQuery = {
  search: string;
  statuses: PaymentStatus[];
  methods: PaymentMethod[];
  currency: string;
  /** "" means all time. */
  date: DatePreset | "";
  from: string;
  to: string;
  /** Amount bounds in major units, as typed by the user. */
  min: string;
  max: string;
  sort: SortField;
  direction: "asc" | "desc";
  page: number;
  size: PageSize;
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

const pageSizes: PageSize[] = [25, 50, 100];
const MAX_PAGE = 100_000;
const MAX_SEARCH_LENGTH = 200;

/** A real calendar date in YYYY-MM-DD form (rejects 2026-02-31 and similar). */
function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

/** A non-negative amount with up to nine digits and three decimals, or "" when invalid. */
function parseAmountBound(value: string | null) {
  if (!value || !/^\d{1,9}(\.\d{1,3})?$/.test(value)) return "";
  return Number.isFinite(Number(value)) ? value : "";
}

/** Comma-separated values from the URL, keeping only known ones. */
function parseList<Value extends string>(value: string | null, allowed: readonly Value[]) {
  const known = new Set<string>(allowed);
  return (value?.split(",") ?? []).filter((item): item is Value => known.has(item));
}

function parseSort(value: string | null): SortField {
  return value === "amount" || value === "status" ? value : "created";
}

function parsePage(value: string | null) {
  return Math.min(MAX_PAGE, Math.max(1, Math.floor(Number(value)) || 1));
}

function parsePageSize(value: string | null): PageSize {
  return pageSizes.find((size) => size === Number(value)) ?? 25;
}

/** Reads a query from URL search params. Invalid or malicious values fall back to defaults. */
export function parseQuery(params: URLSearchParams): PaymentQuery {
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const currency = params.get("currency") ?? "";
  const date = params.get("date") ?? "";
  const min = parseAmountBound(params.get("min"));
  const max = parseAmountBound(params.get("max"));
  // A reversed range is ignored entirely rather than guessing which bound is wrong.
  const amountRangeReversed = Boolean(min && max && Number(min) > Number(max));
  return {
    ...defaultQuery,
    search: (params.get("q") ?? "").slice(0, MAX_SEARCH_LENGTH),
    statuses: parseList(params.get("status"), statuses),
    methods: parseList(params.get("method"), methods),
    currency: /^[a-z]{3}$/.test(currency) ? currency : "",
    date: datePresets.find((preset) => preset === date) ?? "",
    from: isCalendarDate(from) ? from : "",
    to: isCalendarDate(to) ? to : "",
    min: amountRangeReversed ? "" : min,
    max: amountRangeReversed ? "" : max,
    sort: parseSort(params.get("sort")),
    direction: params.get("direction") === "asc" ? "asc" : "desc",
    page: parsePage(params.get("page")),
    size: parsePageSize(params.get("size")),
  };
}

/** Serializes a query, omitting default values so URLs stay short. */
export function serializeQuery(query: PaymentQuery) {
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
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(fields)) if (value) params.set(key, value);
  return params.toString();
}

/** URL of the payments list for a query. */
export function paymentsHref(query: PaymentQuery) {
  const search = serializeQuery(query);
  return `/payments${search ? `?${search}` : ""}`;
}
