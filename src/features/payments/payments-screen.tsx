"use client";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import * as Tooltip from "@radix-ui/react-tooltip";
import {
  getCoreRowModel,
  useReactTable,
  type ColumnOrderState,
  type ColumnSizingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { ArrowDownToLine, SlidersHorizontal } from "lucide-react";
import { DashboardShell, IntroBanner, PageHeading } from "@/components/dashboard/shell";
import { type Snapshot, type PaymentStatus } from "./model";
import {
  csvForPayments,
  defaultQuery,
  parseQuery,
  queryPayments,
  serializeQuery,
  type PaymentQuery,
} from "./query";
import { PaymentSearch } from "./payment-search";
import { PaymentFilters } from "./filters";
import { usePaymentColumns } from "./columns";
import { ColumnMenu } from "./column-menu";
import { PaymentTable } from "./payment-table";
import { TableFooter } from "./table-footer";
import { ActiveFilters } from "./active-filters";
import { getFilterChips } from "./filter-chips";
const statusTabs: { label: string; status: PaymentStatus | "" }[] = [
  { label: "All", status: "" },
  { label: "Succeeded", status: "succeeded" },
  { label: "Refunded", status: "refunded" },
  { label: "Pending", status: "pending" },
  { label: "Failed", status: "failed" },
];
export function PaymentsScreen({ snapshot, now }: { snapshot: Snapshot; now: number }) {
  "use no memo"; // TanStack Table exposes mutable APIs; keep this component outside React Compiler memoization.
  const params = useSearchParams();
  const queryKey = params.toString();
  const query = useMemo(() => parseQuery(new URLSearchParams(queryKey)), [queryKey]);
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([
    "select",
    "amount",
    "status",
    "method",
    "description",
    "customer",
    "id",
    "created",
    "actions",
  ]);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({ description: true });
  const [rowSelection, setRowSelection] = useState({});
  const [exportMessage, setExportMessage] = useState("");
  const update = (patch: Partial<PaymentQuery>, replace = false) => {
    const next = { ...query, page: 1, ...patch };
    const search = serializeQuery(next),
      url = `/payments${search ? `?${search}` : ""}`;
    window.history[replace ? "replaceState" : "pushState"](null, "", url);
    setRowSelection({});
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
  const counts = Object.fromEntries(
    statusTabs.map((tab) => [
      tab.status,
      tab.status
        ? snapshot.payments.filter((p) => p.status === tab.status).length
        : snapshot.payments.length,
    ]),
  );
  const columns = usePaymentColumns(now);
  // TanStack intentionally returns mutable APIs. React Compiler is not enabled; this component also opts out explicitly.
  // oxlint-disable-next-line react/incompatible-library
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    state: { columnOrder, columnSizing, columnVisibility, rowSelection },
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    columnResizeMode: "onChange",
    enableRowSelection: true,
  });
  function moveColumn(id: string, target: string) {
    if (["select", "actions"].includes(id) || ["select", "actions"].includes(target)) return;
    const order = columnOrder.filter((value) => value !== id);
    order.splice(order.indexOf(target), 0, id);
    setColumnOrder(order);
  }
  function exportCsv() {
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", csvForPayments(filtered)], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "payments.csv";
    link.click();
    URL.revokeObjectURL(url);
    setExportMessage(`Exported ${filtered.length} payments.`);
  }
  const chips = getFilterChips(query);
  return (
    <Tooltip.Provider delayDuration={250}>
      <DashboardShell
        search={
          <PaymentSearch value={query.search} onChange={(search) => update({ search }, true)} />
        }
      >
        <div className="payments-page">
          <PageHeading />
          <IntroBanner />
          <div className="status-tabs" aria-label="Payment status views">
            {statusTabs.map((tab) => (
              <button
                key={tab.label}
                className={
                  (
                    tab.status
                      ? query.statuses.length === 1 && query.statuses[0] === tab.status
                      : query.statuses.length === 0
                  )
                    ? "status-tab selected"
                    : "status-tab"
                }
                onClick={() => update({ statuses: tab.status ? [tab.status] : [] })}
              >
                <span>{tab.label}</span>
                <span className="tab-count">{counts[tab.status]}</span>
              </button>
            ))}
          </div>
          <div className="table-toolbar">
            <div className="filters">
              <PaymentFilters
                query={query}
                update={update}
                currencies={[...new Set(snapshot.payments.map((p) => p.currency))].sort()}
              />
              {chips.length > 0 && (
                <button
                  className="text-button"
                  onClick={() => update({ ...defaultQuery, search: query.search })}
                >
                  Clear filters
                </button>
              )}
            </div>
            <div className="table-tools">
              <button className="button small" onClick={exportCsv} disabled={!filtered.length}>
                <ArrowDownToLine size={12} />
                Export
              </button>
              <ColumnMenu table={table} moveColumn={moveColumn} />
            </div>
          </div>
          <ActiveFilters query={query} update={update} />
          <output className="sr-only">
            {filtered.length} matching payments. {exportMessage}
          </output>
          <PaymentTable table={table} query={query} update={update} moveColumn={moveColumn} />
          <TableFooter
            count={filtered.length}
            selected={table.getSelectedRowModel().rows.length}
            page={page}
            pages={pages}
            query={query}
            update={update}
          />
          <div className="data-note">
            <SlidersHorizontal size={12} />
            {snapshot.source === "synthetic"
              ? "Demo workspace · 500 sample payments"
              : `Sandbox snapshot · ${snapshot.payments.length} payments`}
            <span>Dates in Brasília time (UTC−3)</span>
          </div>
        </div>
      </DashboardShell>
    </Tooltip.Provider>
  );
}
