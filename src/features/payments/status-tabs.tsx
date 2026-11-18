"use client";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { Check, Ellipsis } from "lucide-react";
import { cn, menuItemStyles, menuStyles } from "@/components/ui/styles";
import { useFormatters } from "./format-context";
import { statuses, statusLabels, type Payment, type PaymentStatus } from "./model";
import type { UpdateQuery } from "./filters";
import type { PaymentQuery } from "./url-state";

/** Stripe's tab row; the remaining statuses sit in the "…" menu after them. */
const tabStatuses: PaymentStatus[] = [
  "succeeded",
  "refunded",
  "disputed",
  "failed",
  "uncaptured",
  "blocked",
];
const moreStatuses = statuses.filter((status) => !tabStatuses.includes(status));

/** The status a tab view shows: "" for All, or the one status filter. Several mean no tab. */
export function selectedStatusTab(query: PaymentQuery): PaymentStatus | "" | null {
  if (query.statuses.length === 0) return "";
  return query.statuses.length === 1 ? query.statuses[0] : null;
}

type StatusCounts = Record<PaymentStatus, number>;

export function countByStatus(payments: Payment[]) {
  const counts = Object.fromEntries(statuses.map((status) => [status, 0])) as StatusCounts;
  for (const payment of payments) counts[payment.status] += 1;
  return counts;
}

const tabStyles =
  "group flex min-h-10 items-center justify-between gap-2 rounded-md border border-line-strong bg-white px-2.5 py-2 text-left text-11 font-medium whitespace-nowrap text-subtle hover:border-brand-line aria-pressed:border-brand aria-pressed:font-semibold aria-pressed:text-brand aria-pressed:shadow-[0_0_0_1px_var(--color-brand)] md:text-12 lg:px-3";
const countStyles =
  "text-10 font-normal text-ghost tabular-nums group-aria-pressed:text-brand-focus";

type StatusTabsProps = {
  /** Every payment, so counts ignore the other filters. */
  total: number;
  counts: StatusCounts;
  query: PaymentQuery;
  update: UpdateQuery;
};

/** Quick status views with counts over the whole dataset, independent of other filters. */
export function StatusTabs({ total, counts, query, update }: StatusTabsProps) {
  const { formatNumber } = useFormatters();
  const selected = selectedStatusTab(query);
  const selectedMore = moreStatuses.find((status) => status === selected);
  const tabs: { status: PaymentStatus | ""; label: string; count: number }[] = [
    { status: "", label: "All", count: total },
    ...tabStatuses.map((status) => ({
      status,
      label: statusLabels[status],
      count: counts[status],
    })),
  ];
  return (
    <fieldset className="mt-4.25 mb-3.25 flex min-w-0 gap-1.25 max-md:overflow-x-auto max-md:pb-0.75 lg:gap-2">
      <legend className="sr-only">Payment status views</legend>
      {tabs.map((tab) => (
        <button
          key={tab.label}
          type="button"
          aria-pressed={selected === tab.status}
          className={cn(tabStyles, "flex-1 max-md:min-w-25")}
          onClick={() => update({ statuses: tab.status ? [tab.status] : [] })}
        >
          <span>{tab.label}</span>
          <span className={countStyles}>{formatNumber(tab.count)}</span>
        </button>
      ))}
      <Dropdown.Root>
        <Dropdown.Trigger
          aria-pressed={Boolean(selectedMore)}
          aria-label={
            selectedMore ? `More statuses: ${statusLabels[selectedMore]}` : "More statuses"
          }
          className={cn(tabStyles, "shrink-0")}
        >
          {selectedMore ? (
            <>
              <span>{statusLabels[selectedMore]}</span>
              <span className={countStyles}>{formatNumber(counts[selectedMore])}</span>
            </>
          ) : (
            <Ellipsis size={14} aria-hidden="true" />
          )}
        </Dropdown.Trigger>
        <Dropdown.Portal>
          <Dropdown.Content className={menuStyles} align="end" sideOffset={6}>
            <Dropdown.RadioGroup
              value={selectedMore ?? ""}
              onValueChange={(status) => update({ statuses: [status as PaymentStatus] })}
            >
              {moreStatuses.map((status) => (
                <Dropdown.RadioItem key={status} value={status} className={menuItemStyles}>
                  <span className="flex flex-1 items-center justify-between gap-6">
                    {statusLabels[status]}
                    <span className="text-10 text-ghost tabular-nums">
                      {formatNumber(counts[status])}
                    </span>
                  </span>
                  <span className="w-3">
                    <Dropdown.ItemIndicator>
                      <Check size={12} aria-hidden="true" />
                    </Dropdown.ItemIndicator>
                  </span>
                </Dropdown.RadioItem>
              ))}
            </Dropdown.RadioGroup>
          </Dropdown.Content>
        </Dropdown.Portal>
      </Dropdown.Root>
    </fieldset>
  );
}
