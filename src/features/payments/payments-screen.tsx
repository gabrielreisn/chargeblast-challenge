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
import { ExternalLink, Sparkles } from "lucide-react";
import { Banner } from "@/components/dashboard/banner";
import { ActiveFilters } from "./active-filters";
import { usePaymentColumns } from "./columns";
import { DataNote } from "./data-note";
import type { UpdateQuery } from "./filters";
import { formattersFor, type FormatSettings } from "./format";
import { FormattersProvider } from "./format-context";
import type { Snapshot } from "./model";
import { PaymentTable } from "./payment-table";
import { queryPayments } from "./query-payments";
import { StatusTabs } from "./status-tabs";
import { TableFooter } from "./table-footer";
import { paymentTableFeatures, reorderColumns, type MoveColumn } from "./table-features";
import { TableToolbar } from "./table-toolbar";
import { TimeZoneSync } from "./time-zone-sync";
import { paymentsHref, parseQuery } from "./url-state";

const initialColumnOrder: ColumnOrderState = [
  "select",
  "amount",
  "status",
  "method",
  "description",
  "customer",
  "id",
  "created",
  "refunded",
  "customerName",
  "sourceStatus",
  "actions",
];
/** Optional columns start hidden; Edit columns adds them. */
const initialColumnVisibility: ColumnVisibilityState = {
  refunded: false,
  customerName: false,
  sourceStatus: false,
};

type PaymentsScreenProps = {
  snapshot: Snapshot;
  now: number;
  /** The viewer's locale and time zone, resolved on the server from the request. */
  formatSettings: FormatSettings;
};

export function PaymentsScreen({ snapshot, now, formatSettings }: PaymentsScreenProps) {
  "use no memo"; // TanStack Table exposes mutable APIs; keep this component outside React Compiler memoization.
  const params = useSearchParams();
  const queryKey = params.toString();
  const query = useMemo(() => parseQuery(new URLSearchParams(queryKey)), [queryKey]);
  // Table layout preferences are user input with no other source of truth.
  const [columnOrder, setColumnOrder] = useState(initialColumnOrder);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [columnVisibility, setColumnVisibility] = useState(initialColumnVisibility);
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
  const format = formattersFor(formatSettings);
  const filtered = useMemo(
    () => queryPayments(snapshot.payments, query, now, format),
    [snapshot.payments, query, now, format],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / query.size));
  const page = Math.min(query.page, pages);
  const rows = useMemo(
    () => filtered.slice((page - 1) * query.size, page * query.size),
    [filtered, page, query.size],
  );
  const currencies = useMemo(
    () => [...new Set(snapshot.payments.map((payment) => payment.currency))].toSorted(),
    [snapshot.payments],
  );
  const columns = usePaymentColumns(now, format);
  // TanStack exposes mutable APIs. React Compiler is not enabled; this component also opts out explicitly.
  const table = useTable({
    features: paymentTableFeatures,
    data: rows,
    columns,
    getRowId: (row) => row.id,
    // Controlled state wins; initialState is what the Edit columns reset restores.
    initialState: { columnOrder: initialColumnOrder, columnVisibility: initialColumnVisibility },
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

  return (
    <FormattersProvider settings={formatSettings}>
      <TimeZoneSync renderedTimeZone={formatSettings.timeZone} />
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
      <StatusTabs payments={snapshot.payments} query={query} update={update} />
      <TableToolbar
        query={query}
        update={update}
        currencies={currencies}
        filteredPayments={filtered}
        table={table}
        moveColumn={moveColumn}
      />
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
      <DataNote snapshot={snapshot} now={now} />
    </FormattersProvider>
  );
}
