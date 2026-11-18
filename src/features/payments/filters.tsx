"use client";
import { useState, type FormEvent } from "react";
import { CalendarDays, CircleDollarSign, CreditCard, ListFilter, Plus } from "lucide-react";
import { FilterPopover } from "./ui";
import {
  methods,
  methodLabels,
  statuses,
  statusLabels,
  type PaymentMethod,
  type PaymentStatus,
} from "./model";
import { type PaymentQuery } from "./query";

export type UpdateQuery = (patch: Partial<PaymentQuery>, replace?: boolean) => void;
function MultiSelect({
  type,
  selected,
  onChange,
}: {
  type: "status" | "method";
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const selectedSet = new Set(selected);
  const values = type === "status" ? statuses : methods;
  const labels = type === "status" ? statusLabels : methodLabels;
  return (
    <div className="filter-options">
      {values.map((value) => (
        <label key={value} className="checkbox-option">
          <input
            type="checkbox"
            checked={selectedSet.has(value)}
            onChange={(event) =>
              onChange(
                event.target.checked ? [...selected, value] : selected.filter((v) => v !== value),
              )
            }
          />
          <span>
            {labels[value as keyof typeof labels] ??
              (type === "status"
                ? statusLabels[value as PaymentStatus]
                : methodLabels[value as PaymentMethod])}
          </span>
        </label>
      ))}
      <p className="filter-note">Selections apply immediately.</p>
    </div>
  );
}
function DateForm({ query, update }: { query: PaymentQuery; update: UpdateQuery }) {
  const [error, setError] = useState("");
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget),
      from = String(values.get("from")),
      to = String(values.get("to"));
    if (!from || !to || from > to) {
      setError("Choose a valid start and end date.");
      return;
    }
    setError("");
    update({ date: "custom", from, to });
  }
  return (
    <div>
      <div className="preset-options">
        {[
          ["today", "Today"],
          ["7", "Last 7 days"],
          ["30", "Last 30 days"],
          ["", "All time"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={query.date === value ? "preset selected" : "preset"}
            onClick={() => update({ date: value, from: "", to: "" })}
          >
            {label}
          </button>
        ))}
      </div>
      <form className="filter-form" onSubmit={apply}>
        <div className="form-divider">Custom range</div>
        <label>
          Start date
          <input type="date" name="from" required defaultValue={query.from} />
        </label>
        <label>
          End date
          <input type="date" name="to" required defaultValue={query.to} />
        </label>
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        <button className="button primary" type="submit">
          Apply dates
        </button>
      </form>
    </div>
  );
}
function AmountForm({ query, update }: { query: PaymentQuery; update: UpdateQuery }) {
  const [error, setError] = useState("");
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget),
      min = String(data.get("min")),
      max = String(data.get("max"));
    if (min && max && Number(min) > Number(max)) {
      setError("Minimum must not exceed maximum.");
      return;
    }
    setError("");
    update({ min, max });
  }
  return (
    <form className="filter-form" onSubmit={apply}>
      <label>
        Minimum amount
        <input
          name="min"
          type="number"
          step="0.001"
          min="0"
          placeholder="0.00"
          defaultValue={query.min}
        />
      </label>
      <label>
        Maximum amount
        <input
          name="max"
          type="number"
          step="0.001"
          min="0"
          placeholder="No limit"
          defaultValue={query.max}
        />
      </label>
      <p className="filter-note">
        Amounts use each currency’s displayed units. Choose a currency to compare like for like.
      </p>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      <button className="button primary" type="submit">
        Apply amount
      </button>
    </form>
  );
}
export function PaymentFilters({
  query,
  update,
  currencies,
}: {
  query: PaymentQuery;
  update: UpdateQuery;
  currencies: string[];
}) {
  return (
    <>
      <FilterPopover
        label="Date and time"
        icon={<CalendarDays size={12} />}
        active={Boolean(query.date)}
      >
        <DateForm query={query} update={update} />
      </FilterPopover>
      <FilterPopover
        label="Amount"
        icon={<CircleDollarSign size={12} />}
        active={Boolean(query.min || query.max)}
      >
        <AmountForm query={query} update={update} />
      </FilterPopover>
      <FilterPopover label="Currency" icon={<Plus size={12} />} active={Boolean(query.currency)}>
        <div className="filter-options">
          <label className="field-label">
            Payment currency
            <select
              value={query.currency}
              onChange={(event) => update({ currency: event.target.value })}
            >
              <option value="">All currencies</option>
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
        </div>
      </FilterPopover>
      <FilterPopover
        label="Status"
        icon={<ListFilter size={12} />}
        active={query.statuses.length > 0}
      >
        <MultiSelect
          type="status"
          selected={query.statuses}
          onChange={(values) => update({ statuses: values as PaymentStatus[] })}
        />
      </FilterPopover>
      <FilterPopover
        label="Payment method"
        icon={<CreditCard size={12} />}
        active={query.methods.length > 0}
      >
        <MultiSelect
          type="method"
          selected={query.methods}
          onChange={(values) => update({ methods: values as PaymentMethod[] })}
        />
      </FilterPopover>
    </>
  );
}
