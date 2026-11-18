import { statusLabels, methodLabels } from "./model";
import type { PaymentQuery } from "./query";
export function getFilterChips(query: PaymentQuery) {
  return [
    query.date
      ? {
          key: "date",
          label:
            query.date === "today"
              ? "Today"
              : query.date === "custom"
                ? `${query.from} – ${query.to}`
                : `Last ${query.date} days`,
          reset: { date: "", from: "", to: "" },
        }
      : null,
    ...query.statuses.map((s) => ({
      key: s,
      label: statusLabels[s],
      reset: { statuses: query.statuses.filter((v) => v !== s) },
    })),
    ...query.methods.map((m) => ({
      key: m,
      label: methodLabels[m],
      reset: { methods: query.methods.filter((v) => v !== m) },
    })),
    query.currency
      ? { key: "currency", label: query.currency.toUpperCase(), reset: { currency: "" } }
      : null,
    query.min || query.max
      ? {
          key: "amount",
          label: `Amount: ${query.min || "0"} – ${query.max || "Any"}`,
          reset: { min: "", max: "" },
        }
      : null,
  ].filter((item) => item !== null);
}
