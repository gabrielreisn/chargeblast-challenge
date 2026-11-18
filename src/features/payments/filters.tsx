"use client";
import { useId, useState, type FormEvent } from "react";
import { buttonStyles, cn, fieldStyles, noteStyles } from "@/components/ui/styles";
import { FilterPopover } from "@/components/ui/filter-popover";
import { unmaskAmount } from "./amount-mask";
import { AmountInput } from "./amount-input";
import { datePresetLabels } from "./filter-chips";
import { fractionDigitsFor } from "./format";
import { useFormatters } from "./format-context";
import {
  methods,
  methodLabels,
  statuses,
  statusLabels,
  type PaymentMethod,
  type PaymentStatus,
} from "./model";
import type { DatePreset, PaymentQuery } from "./url-state";

export type UpdateQuery = (patch: Partial<PaymentQuery>, replace?: boolean) => void;

type QueryControlProps = { query: PaymentQuery; update: UpdateQuery };

const optionsStyles = "px-3.5 py-2.5";
const formStyles = "flex flex-col gap-2.75 px-3.5 py-3.25";
const labelStyles = "flex flex-col gap-1.5 text-11";
const submitStyles = cn(buttonStyles({ variant: "primary" }), "mt-0.5 self-end");
const errorStyles = "text-11 text-danger-strong";

type MultiSelectProps<Value extends string> = {
  values: readonly Value[];
  labels: Record<Value, string>;
  selected: Value[];
  onChange: (values: Value[]) => void;
};

function MultiSelect<Value extends string>({
  values,
  labels,
  selected,
  onChange,
}: MultiSelectProps<Value>) {
  return (
    <div className={optionsStyles}>
      {values.map((value) => (
        <label key={value} className="flex cursor-pointer items-center gap-2.5 py-2 text-12">
          <input
            type="checkbox"
            checked={selected.includes(value)}
            onChange={(event) =>
              onChange(
                event.target.checked ? [...selected, value] : selected.filter((v) => v !== value),
              )
            }
          />
          <span>{labels[value]}</span>
        </label>
      ))}
      <p className={noteStyles}>Selections apply immediately.</p>
    </div>
  );
}

const datePresets: { value: DatePreset | ""; label: string }[] = [
  ...Object.entries(datePresetLabels).map(([value, label]) => ({
    value: value as DatePreset,
    label,
  })),
  { value: "", label: "All time" },
];

function DateForm({ query, update }: QueryControlProps) {
  // Validation feedback for the last submit; not derivable from props.
  const [error, setError] = useState("");
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const from = String(values.get("from"));
    const to = String(values.get("to"));
    if (!from || !to || from > to) {
      setError("Choose a valid start and end date.");
      return;
    }
    setError("");
    update({ date: "custom", from, to });
  }
  return (
    <div>
      <div className="flex flex-col p-1.75">
        {datePresets.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={query.date === value}
            className="rounded px-2.25 py-1.75 text-left text-12 hover:bg-[#f1efff] hover:text-brand aria-pressed:bg-[#f1efff] aria-pressed:text-brand"
            onClick={() => update({ date: value, from: "", to: "" })}
          >
            {label}
          </button>
        ))}
      </div>
      <form className={formStyles} onSubmit={apply}>
        <div className="border-t border-[#e9ecf1] pt-3 text-10 text-[#7d8797]">Custom range</div>
        <label className={labelStyles}>
          Start date
          <input
            className={fieldStyles}
            type="date"
            name="from"
            required
            defaultValue={query.from}
          />
        </label>
        <label className={labelStyles}>
          End date
          <input className={fieldStyles} type="date" name="to" required defaultValue={query.to} />
        </label>
        {error && (
          <p role="alert" className={errorStyles}>
            {error}
          </p>
        )}
        <button className={submitStyles} type="submit">
          Apply dates
        </button>
      </form>
    </div>
  );
}

function AmountForm({ query, update }: QueryControlProps) {
  const { locale } = useFormatters();
  const id = useId();
  // Validation feedback for the last submit; not derivable from props.
  const [error, setError] = useState("");
  const fractionDigits = query.currency ? fractionDigitsFor(query.currency) : 2;
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const min = unmaskAmount(String(data.get("min")), locale);
    const max = unmaskAmount(String(data.get("max")), locale);
    if (min && max && Number(min) > Number(max)) {
      setError("Minimum must not exceed maximum.");
      return;
    }
    setError("");
    update({ min, max });
  }
  return (
    // Keyed by currency so a precision change re-masks the default values.
    <form key={fractionDigits} className={formStyles} onSubmit={apply}>
      <div className={labelStyles}>
        <label htmlFor={`${id}-min`}>Minimum amount</label>
        <AmountInput
          id={`${id}-min`}
          name="min"
          defaultValue={query.min}
          fractionDigits={fractionDigits}
        />
      </div>
      <div className={labelStyles}>
        <label htmlFor={`${id}-max`}>Maximum amount</label>
        <AmountInput
          id={`${id}-max`}
          name="max"
          defaultValue={query.max}
          fractionDigits={fractionDigits}
          placeholder="No limit"
        />
      </div>
      <p className={noteStyles}>
        {query.currency
          ? `Amounts in ${query.currency.toUpperCase()}.`
          : "Amounts use each currency’s displayed units. Choose a currency to compare like for like."}
      </p>
      {error && (
        <p role="alert" className={errorStyles}>
          {error}
        </p>
      )}
      <button className={submitStyles} type="submit">
        Apply amount
      </button>
    </form>
  );
}

type PaymentFiltersProps = QueryControlProps & { currencies: string[] };

export function PaymentFilters({ query, update, currencies }: PaymentFiltersProps) {
  return (
    <>
      <FilterPopover label="Date and time" active={Boolean(query.date)}>
        <DateForm query={query} update={update} />
      </FilterPopover>
      <FilterPopover label="Amount" active={Boolean(query.min || query.max)}>
        <AmountForm query={query} update={update} />
      </FilterPopover>
      <FilterPopover label="Currency" active={Boolean(query.currency)}>
        <div className={optionsStyles}>
          <label className="flex flex-col gap-1.75 text-11">
            Payment currency
            <select
              className={fieldStyles}
              value={query.currency}
              onChange={(event) => update({ currency: event.target.value })}
            >
              <option value="">All currencies</option>
              {currencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
        </div>
      </FilterPopover>
      <FilterPopover label="Status" active={query.statuses.length > 0}>
        <MultiSelect<PaymentStatus>
          values={statuses}
          labels={statusLabels}
          selected={query.statuses}
          onChange={(values) => update({ statuses: values })}
        />
      </FilterPopover>
      <FilterPopover label="Payment method" active={query.methods.length > 0}>
        <MultiSelect<PaymentMethod>
          values={methods}
          labels={methodLabels}
          selected={query.methods}
          onChange={(values) => update({ methods: values })}
        />
      </FilterPopover>
    </>
  );
}
