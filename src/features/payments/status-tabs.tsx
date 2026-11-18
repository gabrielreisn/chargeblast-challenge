"use client";
import { useMemo } from "react";
import type { Payment, PaymentStatus } from "./model";
import type { UpdateQuery } from "./filters";
import type { PaymentQuery } from "./url-state";

type StatusTab = { label: string; status: PaymentStatus | "" };

const statusTabs: StatusTab[] = [
  { label: "All", status: "" },
  { label: "Succeeded", status: "succeeded" },
  { label: "Refunded", status: "refunded" },
  { label: "Pending", status: "pending" },
  { label: "Failed", status: "failed" },
];

/** A tab is selected when it is the only status filter ("All" when there is none). */
function isTabSelected(tab: StatusTab, query: PaymentQuery) {
  if (!tab.status) return query.statuses.length === 0;
  return query.statuses.length === 1 && query.statuses[0] === tab.status;
}

function countByStatus(payments: Payment[]) {
  const counts: Record<StatusTab["status"], number> = {
    "": payments.length,
    succeeded: 0,
    refunded: 0,
    pending: 0,
    failed: 0,
  };
  for (const payment of payments) counts[payment.status] += 1;
  return counts;
}

type StatusTabsProps = { payments: Payment[]; query: PaymentQuery; update: UpdateQuery };

/** Quick status views with counts over the whole dataset, independent of other filters. */
export function StatusTabs({ payments, query, update }: StatusTabsProps) {
  const counts = useMemo(() => countByStatus(payments), [payments]);
  return (
    <fieldset className="mt-4.25 mb-3.25 flex min-w-0 gap-1.25 max-md:overflow-x-auto max-md:pb-0.75 lg:gap-2">
      <legend className="sr-only">Payment status views</legend>
      {statusTabs.map((tab) => (
        <button
          key={tab.label}
          type="button"
          aria-pressed={isTabSelected(tab, query)}
          className="group flex min-h-9 flex-1 items-center justify-between rounded-[5px] border border-[#e0e4eb] bg-white p-2 text-left text-10 text-muted hover:border-[#b9b2fb] aria-pressed:border-[#8174ff] aria-pressed:text-brand aria-pressed:shadow-[0_0_0_1px_#8174ff0a] max-md:min-w-25 md:text-11 lg:px-2.75 lg:py-2.25"
          onClick={() => update({ statuses: tab.status ? [tab.status] : [] })}
        >
          <span>{tab.label}</span>
          <span className="text-10 text-[#9097a6] tabular-nums group-aria-pressed:text-[#8f84ed]">
            {counts[tab.status]}
          </span>
        </button>
      ))}
    </fieldset>
  );
}
