import type { Formatters } from "./format";
import { methodLabels, statusLabels } from "./model";
import type { DatePreset, PaymentQuery } from "./url-state";

/** One removable chip under the toolbar; `reset` is the query patch that removes it. */
type FilterChip = { key: string; label: string; reset: Partial<PaymentQuery> };

/** Preset names, shared with the Date and time filter's buttons. */
export const datePresetLabels: Record<Exclude<DatePreset, "custom">, string> = {
  today: "Today",
  "7": "Last 7 days",
  "30": "Last 30 days",
};

type QueryFilter = {
  isActive: (query: PaymentQuery) => boolean;
  chips: (query: PaymentQuery, format: Formatters) => FilterChip[];
};

function dateLabel(query: PaymentQuery, format: Formatters) {
  if (query.date !== "custom") return query.date ? datePresetLabels[query.date] : "";
  const from = query.from ? format.formatCalendarDate(query.from) : "Any";
  const to = query.to ? format.formatCalendarDate(query.to) : "Any";
  return `${from} – ${to}`;
}

function amountLabel(query: PaymentQuery, format: Formatters) {
  const bound = (value: string) => format.formatNumber(Number(value));
  const range =
    query.min && query.max
      ? `${bound(query.min)} – ${bound(query.max)}`
      : query.min
        ? `≥ ${bound(query.min)}`
        : `≤ ${bound(query.max)}`;
  return query.currency ? `${range} ${query.currency.toUpperCase()}` : range;
}

/** Every query field that filters rows, in toolbar order. Search is separate: it has its own field. */
const queryFilters: QueryFilter[] = [
  {
    isActive: (query) => Boolean(query.date),
    chips: (query, format) => [
      {
        key: "date",
        label: `Date: ${dateLabel(query, format)}`,
        reset: { date: "", from: "", to: "" },
      },
    ],
  },
  {
    isActive: (query) => Boolean(query.min || query.max),
    chips: (query, format) => [
      {
        key: "amount",
        label: `Amount: ${amountLabel(query, format)}`,
        reset: { min: "", max: "" },
      },
    ],
  },
  {
    isActive: (query) => Boolean(query.currency),
    chips: (query) => [
      {
        key: "currency",
        label: `Currency: ${query.currency.toUpperCase()}`,
        reset: { currency: "" },
      },
    ],
  },
  {
    isActive: (query) => query.statuses.length > 0,
    // One chip per value, so each can be removed on its own.
    chips: (query) =>
      query.statuses.map((status) => ({
        key: `status:${status}`,
        label: `Status: ${statusLabels[status]}`,
        reset: { statuses: query.statuses.filter((value) => value !== status) },
      })),
  },
  {
    isActive: (query) => query.methods.length > 0,
    chips: (query) =>
      query.methods.map((method) => ({
        key: `method:${method}`,
        label: `Payment method: ${methodLabels[method]}`,
        reset: { methods: query.methods.filter((value) => value !== method) },
      })),
  },
];

export function hasActiveFilters(query: PaymentQuery) {
  return queryFilters.some((filter) => filter.isActive(query));
}

export function getFilterChips(query: PaymentQuery, format: Formatters) {
  return queryFilters.flatMap((filter) =>
    filter.isActive(query) ? filter.chips(query, format) : [],
  );
}
