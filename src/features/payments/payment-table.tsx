"use client";
import { flexRender } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { buttonStyles, cn } from "@/components/ui/styles";
import { defaultQuery, type PaymentQuery } from "./url-state";
import type { UpdateQuery } from "./filters";
import { ColumnDndProvider, SortableCell, SortableHeaderCell } from "./column-dnd";
import {
  fixedColumnIds,
  type MoveColumn,
  type PaymentHeader,
  type PaymentTable,
} from "./table-features";

const sortableColumns = ["created", "amount", "status"];
/** Numeric columns: header and values align to the end so digits line up. */
const endAlignedColumns = ["amount"];

const headerCellStyles =
  "group/th relative h-7.5 border-b border-line px-2.25 py-1.5 text-10 font-semibold whitespace-nowrap text-[#566172] first:pl-1.75";
const bodyCellStyles =
  "h-6.75 truncate border-b border-line-soft px-2.25 py-0.75 leading-4.5 text-[#606c7e] group-last/row:border-b-0 first:pl-1.75 2xl:h-7.75";

type SortButtonProps = {
  header: PaymentHeader;
  query: PaymentQuery;
  update: UpdateQuery;
};

function SortButton({ header, query, update }: SortButtonProps) {
  const active = query.sort === header.column.id;
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.25 text-10 font-semibold [&>svg]:text-[#8c94a6]"
      onClick={() =>
        update({
          sort: header.column.id as PaymentQuery["sort"],
          direction: active && query.direction === "desc" ? "asc" : "desc",
        })
      }
    >
      {flexRender(header.column.columnDef.header, header.getContext())}
      {!active ? (
        <ArrowUpDown size={10} aria-hidden="true" />
      ) : query.direction === "desc" ? (
        <ArrowDown size={11} aria-hidden="true" />
      ) : (
        <ArrowUp size={11} aria-hidden="true" />
      )}
    </button>
  );
}

type ColumnResizerProps = { header: PaymentHeader; table: PaymentTable };

function ColumnResizer({ header, table }: ColumnResizerProps) {
  return (
    <button
      type="button"
      aria-label={`Resize ${header.column.columnDef.header} column`}
      className={cn(
        "absolute top-1.25 right-0 h-5 w-1 cursor-col-resize touch-none border-r select-none group-hover/th:border-[#b3a6ff]",
        header.column.getIsResizing() ? "border-[#b3a6ff]" : "border-transparent",
      )}
      onKeyDown={(event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        const size = Math.max(
          header.column.columnDef.minSize ?? 80,
          header.getSize() + (event.key === "ArrowRight" ? 10 : -10),
        );
        table.setColumnSizing((current) => ({ ...current, [header.column.id]: size }));
      }}
      // Keep the resize gesture from also starting a column drag.
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={header.getResizeHandler()}
      onTouchStart={header.getResizeHandler()}
      onDoubleClick={() => header.column.resetSize()}
    />
  );
}

function columnLabel(header: PaymentHeader) {
  const label = header.column.columnDef.header;
  return typeof label === "string" ? label : header.column.id;
}

function ariaSort(query: PaymentQuery, columnId: string) {
  if (!sortableColumns.includes(columnId)) return undefined;
  if (query.sort !== columnId) return "none";
  return query.direction === "asc" ? "ascending" : "descending";
}

type PaymentTableProps = {
  table: PaymentTable;
  query: PaymentQuery;
  update: UpdateQuery;
  moveColumn: MoveColumn;
};

export function PaymentTable({ table, query, update, moveColumn }: PaymentTableProps) {
  "use no memo";
  const rows = table.getRowModel().rows;
  const headers = table.getHeaderGroups()[0]?.headers ?? [];
  const reorderable = headers.filter((header) => !fixedColumnIds.includes(header.column.id));
  const labels = Object.fromEntries(
    reorderable.map((header) => [header.column.id, columnLabel(header)]),
  );
  return (
    <div className="min-h-37.5 w-full overflow-x-auto border-b border-line">
      <ColumnDndProvider
        columnIds={reorderable.map((header) => header.column.id)}
        labels={labels}
        moveColumn={moveColumn}
      >
        <table
          className="table-fixed border-collapse text-left text-11"
          style={{ width: `max(100%, ${table.getTotalSize()}px)` }}
        >
          <caption className="sr-only">
            Payments. Sort by amount, status, or date using the column heading buttons. Reorder
            columns by dragging a heading or with its reorder handle.
          </caption>
          <thead>
            <tr>
              {headers.map((header) => {
                const columnId = header.column.id;
                const className = cn(
                  headerCellStyles,
                  endAlignedColumns.includes(columnId) && "text-right",
                );
                const content = (
                  <>
                    {sortableColumns.includes(columnId) ? (
                      <SortButton header={header} query={query} update={update} />
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                    {header.column.getCanResize() && (
                      <ColumnResizer header={header} table={table} />
                    )}
                  </>
                );
                return fixedColumnIds.includes(columnId) ? (
                  <th key={header.id} style={{ width: header.getSize() }} className={className}>
                    {content}
                  </th>
                ) : (
                  <SortableHeaderCell
                    key={header.id}
                    columnId={columnId}
                    label={labels[columnId]}
                    width={header.getSize()}
                    ariaSort={ariaSort(query, columnId)}
                    className={className}
                  >
                    {content}
                  </SortableHeaderCell>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                data-selected={row.getIsSelected()}
                className="group/row hover:bg-[#f8f9fc] data-[selected=true]:bg-[#f5f3ff]"
              >
                {row.getVisibleCells().map((cell) => {
                  const content = flexRender(cell.column.columnDef.cell, cell.getContext());
                  return fixedColumnIds.includes(cell.column.id) ? (
                    <td key={cell.id} className={bodyCellStyles}>
                      {content}
                    </td>
                  ) : (
                    <SortableCell
                      key={cell.id}
                      columnId={cell.column.id}
                      width={cell.column.getSize()}
                      className={bodyCellStyles}
                    >
                      {content}
                    </SortableCell>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </ColumnDndProvider>
      {!rows.length && (
        <EmptyState
          compact
          icon={<Search size={18} />}
          title="No payments found"
          description="Try a different search or adjust your filters."
        >
          <button type="button" className={buttonStyles()} onClick={() => update(defaultQuery)}>
            Clear all filters
          </button>
        </EmptyState>
      )}
    </div>
  );
}
