"use client";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  useTable,
  type ColumnOrderState,
  type ColumnSizingState,
  type RowSelectionState,
  type ColumnVisibilityState,
} from "@tanstack/react-table";
import { ArrowDownToLine, ExternalLink, SlidersHorizontal, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Banner } from "@/components/dashboard/banner";
import { buttonStyles, textButtonStyles } from "@/components/ui/styles";
import { snapshotSourceLabels, type Payment, type PaymentStatus, type Snapshot } from "./model";
import {
  csvForPayments,
  defaultQuery,
  paymentsHref,
  parseQuery,
  queryPayments,
  type PaymentQuery,
} from "./query";
import { PaymentFilters, type UpdateQuery } from "./filters";
import { usePaymentColumns } from "./columns";
import { ColumnMenu } from "./column-menu";
import { PaymentTable, type MoveColumn } from "./payment-table";
import { TableFooter } from "./table-footer";
import { ActiveFilters } from "./active-filters";
import { getFilterChips } from "./filter-chips";
import { paymentTableFeatures, reorderColumns } from "./table-features";

type StatusTab = { label: string; status: PaymentStatus | "" };

const statusTabs: StatusTab[] = [
  { label: "All", status: "" },
  { label: "Succeeded", status: "succeeded" },
  { label: "Refunded", status: "refunded" },
  { label: "Pending", status: "pending" },
  { label: "Failed", status: "failed" },
];

const initialColumnOrder: ColumnOrderState = [
  "select",
  "amount",
  "status",
  "method",
  "description",
  "customer",
  "id",
  "created",
  "actions",
];

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

function downloadCsv(payments: Payment[]) {
  const url = URL.createObjectURL(
    new Blob(["﻿", csvForPayments(payments)], { type: "text/csv;charset=utf-8;" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "payments.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function describeSnapshot({ source, payments }: Snapshot) {
  const count = payments.length.toLocaleString();
  if (source === "synthetic") return `Demo workspace · ${count} sample payments`;
  return `${snapshotSourceLabels[source]} · ${count} payments`;
}

type PaymentsScreenProps = { snapshot: Snapshot; now: number };

export function PaymentsScreen({ snapshot, now }: PaymentsScreenProps) {
  "use no memo"; // TanStack Table exposes mutable APIs; keep this component outside React Compiler memoization.
  const params = useSearchParams();
  const queryKey = params.toString();
  const query = useMemo(() => parseQuery(new URLSearchParams(queryKey)), [queryKey]);
  // Table layout preferences are user input with no other source of truth.
  const [columnOrder, setColumnOrder] = useState(initialColumnOrder);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({
    description: true,
  });
  // Selection belongs to one result set: it is keyed by the query, so any query change
  // derives an empty selection without an effect.
  const [selection, setSelection] = useState<{ key: string; rows: RowSelectionState }>({
    key: queryKey,
    rows: {},
  });
  const rowSelection = selection.key === queryKey ? selection.rows : {};

  const update: UpdateQuery = (patch, replace = false) => {
    const href = paymentsHref({ ...query, page: 1, ...patch });
    window.history[replace ? "replaceState" : "pushState"](null, "", href);
  };
  const filtered = useMemo(
    () => queryPayments(snapshot.payments, query, now),
    [snapshot.payments, query, now],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / query.size));
  const page = Math.min(query.page, pages);
  const rows = useMemo(
    () => filtered.slice((page - 1) * query.size, page * query.size),
    [filtered, page, query.size],
  );
  const counts = useMemo(() => countByStatus(snapshot.payments), [snapshot.payments]);
  const currencies = useMemo(
    () => [...new Set(snapshot.payments.map((payment) => payment.currency))].toSorted(),
    [snapshot.payments],
  );
  const chips = getFilterChips(query);
  const columns = usePaymentColumns(now);
  // TanStack exposes mutable APIs. React Compiler is not enabled; this component also opts out explicitly.
  const table = useTable({
    features: paymentTableFeatures,
    data: rows,
    columns,
    getRowId: (row) => row.id,
    state: { columnOrder, columnSizing, columnVisibility, rowSelection },
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updater) =>
      setSelection((current) => {
        const previous = current.key === queryKey ? current.rows : {};
        return {
          key: queryKey,
          rows: typeof updater === "function" ? updater(previous) : updater,
        };
      }),
    columnResizeMode: "onChange",
    enableRowSelection: true,
  });

  const moveColumn: MoveColumn = (id, target) =>
    setColumnOrder((order) => reorderColumns(order, id, target));

  function exportCsv() {
    try {
      downloadCsv(filtered);
      toast.success(`Exported ${filtered.length.toLocaleString()} payments`);
    } catch (error) {
      console.error(error);
      toast.error("Export failed", {
        description: "The CSV file couldn’t be created. Try again.",
        action: { label: "Try again", onClick: exportCsv },
      });
    }
  }

  return (
    <>
      <Banner
        icon={<Sparkles size={13} aria-hidden="true" />}
        action={{
          label: (
            <>
              Get started <ExternalLink size={11} aria-hidden="true" />
            </>
          ),
          href: "https://docs.stripe.com/radar",
        }}
      >
        <span className="mr-1.75 font-semibold text-[#40495b]">New</span> Rule Attributes are now in
        Sigma and Data Pipeline for better fraud insights.
      </Banner>
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
      <div className="mb-2.75 flex flex-col gap-2.5 md:flex-row md:items-start md:justify-between md:gap-3 lg:items-center">
        <div className="flex flex-wrap items-center gap-1.75">
          <PaymentFilters query={query} update={update} currencies={currencies} />
          {chips.length > 0 && (
            <button
              type="button"
              className={textButtonStyles}
              onClick={() => update({ ...defaultQuery, search: query.search })}
            >
              Clear filters
            </button>
          )}
        </div>
        <div className="flex shrink-0 gap-1.75 self-end md:self-auto">
          <button
            type="button"
            className={buttonStyles({ size: "sm" })}
            onClick={exportCsv}
            disabled={!filtered.length}
          >
            <ArrowDownToLine size={12} aria-hidden="true" />
            Export
          </button>
          <ColumnMenu table={table} moveColumn={moveColumn} />
        </div>
      </div>
      <ActiveFilters query={query} update={update} />
      <output className="sr-only">{filtered.length} matching payments.</output>
      <PaymentTable table={table} query={query} update={update} moveColumn={moveColumn} />
      <TableFooter
        count={filtered.length}
        selected={table.getSelectedRowModel().rows.length}
        page={page}
        pages={pages}
        query={query}
        update={update}
      />
      <div className="mt-5.5 flex flex-wrap items-start gap-1.5 pb-5 text-9 leading-3.75 text-[#98a0b0] md:flex-nowrap md:items-center md:leading-normal">
        <SlidersHorizontal size={12} aria-hidden="true" />
        {describeSnapshot(snapshot)}
        <span className="ml-4.5 w-full md:ml-auto md:w-auto">Dates in Brasília time (UTC−3)</span>
      </div>
    </>
  );
}
