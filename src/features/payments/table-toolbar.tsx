"use client";
import { ArrowDownToLine } from "lucide-react";
import { toast } from "sonner";
import { buttonStyles, textButtonStyles } from "@/components/ui/styles";
import { ColumnMenu } from "./column-menu";
import { csvForPayments } from "./csv";
import { getFilterChips } from "./filter-chips";
import { PaymentFilters, type UpdateQuery } from "./filters";
import type { Payment } from "./model";
import type { MoveColumn, PaymentTable } from "./table-features";
import { defaultQuery, type PaymentQuery } from "./url-state";

function downloadCsv(payments: Payment[]) {
  // The byte-order mark makes Excel read the file as UTF-8.
  const blob = new Blob(["﻿", csvForPayments(payments)], { type: "text/csv;charset=utf-8;" });
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

/** Filter buttons on the left; CSV export and column settings on the right. */
export function TableToolbar({
  query,
  update,
  currencies,
  filteredPayments,
  table,
  moveColumn,
}: TableToolbarProps) {
  const hasFilters = getFilterChips(query).length > 0;

  function exportCsv() {
    try {
      downloadCsv(filteredPayments);
      toast.success(`Exported ${filteredPayments.length.toLocaleString()} payments`);
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
          disabled={!filteredPayments.length}
        >
          <ArrowDownToLine size={12} aria-hidden="true" />
          Export
        </button>
        <ColumnMenu table={table} moveColumn={moveColumn} />
      </div>
    </div>
  );
}
