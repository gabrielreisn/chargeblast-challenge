"use client";
import { Share } from "lucide-react";
import { toast } from "sonner";
import { buttonStyles, textButtonStyles } from "@/components/ui/styles";
import { ColumnMenu } from "./column-menu";
import { csvForPayments } from "./csv";
import { hasActiveFilters } from "./filter-chips";
import { useFormatters } from "./format-context";
import { PaymentFilters, type UpdateQuery } from "./filters";
import type { Payment } from "./model";
import type { MoveColumn, PaymentTable } from "./table-features";
import { defaultQuery, type PaymentQuery } from "./url-state";

function downloadCsv(payments: Payment[], columnIds: string[]) {
  // The byte-order mark makes Excel read the file as UTF-8.
  const blob = new Blob(["﻿", csvForPayments(payments, columnIds)], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "payments.csv";
  link.click();
  URL.revokeObjectURL(url);
}

type TableToolbarProps = {
  query: PaymentQuery;
  update: UpdateQuery;
  currencies: string[];
  /** Every payment matching the current filters, across all pages. */
  filteredPayments: Payment[];
  table: PaymentTable;
  moveColumn: MoveColumn;
};

/**
 * Filter buttons on the left; CSV export and column settings on the right. The export has the
 * table's visible columns in their current order, and the selected rows when there are any,
 * otherwise every payment matching the filters.
 */
export function TableToolbar({
  query,
  update,
  currencies,
  filteredPayments,
  table,
  moveColumn,
}: TableToolbarProps) {
  "use no memo"; // Reads TanStack's mutable table state during render.
  const { formatNumber } = useFormatters();
  const hasFilters = hasActiveFilters(query);
  const selected = table.getSelectedRowModel().rows.map((row) => row.original);
  const exported = selected.length ? selected : filteredPayments;

  function exportCsv() {
    try {
      downloadCsv(
        exported,
        table.getVisibleLeafColumns().map((column) => column.id),
      );
      toast.success(`Exported ${formatNumber(exported.length)} payments`);
    } catch (error) {
      console.error(error);
      toast.error("Export failed", {
        description: "The CSV file couldn’t be created. Try again.",
        action: { label: "Try again", onClick: exportCsv },
      });
    }
  }

  return (
    <div className="mb-2.75 flex flex-col gap-2.5 md:flex-row md:items-start md:justify-between md:gap-3 lg:items-center">
      <div className="flex flex-wrap items-center gap-1.75">
        <PaymentFilters query={query} update={update} currencies={currencies} />
        {hasFilters && (
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
          disabled={!exported.length}
        >
          <Share size={12} aria-hidden="true" />
          {selected.length ? "Export selected" : "Export"}
        </button>
        <ColumnMenu table={table} moveColumn={moveColumn} />
      </div>
    </div>
  );
}
