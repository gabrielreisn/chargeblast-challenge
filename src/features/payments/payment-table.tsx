"use client";
import { useRef } from "react";
import { flexRender, type Table } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import type { Payment } from "./model";
import { defaultQuery, type PaymentQuery } from "./query";
import type { UpdateQuery } from "./filters";
export function PaymentTable({
  table,
  query,
  update,
  moveColumn,
}: {
  table: Table<Payment>;
  query: PaymentQuery;
  update: UpdateQuery;
  moveColumn: (id: string, target: string) => void;
}) {
  "use no memo";
  const dragged = useRef<string | null>(null);
  return (
    <div className="table-scroll">
      <table className="payments-table" style={{ width: `max(100%, ${table.getTotalSize()}px)` }}>
        <caption className="sr-only">
          Payments. Sort by amount, status, or date using the column heading buttons.
        </caption>
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => {
                const sortable = ["created", "amount", "status"].includes(header.column.id);
                return (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    aria-sort={
                      sortable
                        ? query.sort === header.column.id
                          ? query.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                        : undefined
                    }
                    draggable={!["select", "actions"].includes(header.id)}
                    onDragStart={() => (dragged.current = header.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (dragged.current) moveColumn(dragged.current, header.id);
                      dragged.current = null;
                    }}
                  >
                    {sortable ? (
                      <button
                        className="sort-heading"
                        onClick={() =>
                          update({
                            sort: header.column.id as PaymentQuery["sort"],
                            direction:
                              query.sort === header.column.id && query.direction === "desc"
                                ? "asc"
                                : "desc",
                          })
                        }
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {query.sort === header.column.id ? (
                          query.direction === "desc" ? (
                            <ArrowDown size={11} />
                          ) : (
                            <ArrowUp size={11} />
                          )
                        ) : (
                          <ArrowUpDown size={10} />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                    {header.column.getCanResize() && (
                      <button
                        type="button"
                        aria-label={`Resize ${header.column.columnDef.header} column`}
                        className={`column-resizer ${header.column.getIsResizing() ? "resizing" : ""}`}
                        onKeyDown={(event) => {
                          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                            event.preventDefault();
                            const size = Math.max(
                              header.column.columnDef.minSize ?? 80,
                              header.getSize() + (event.key === "ArrowRight" ? 10 : -10),
                            );
                            table.setColumnSizing((current) => ({
                              ...current,
                              [header.column.id]: size,
                            }));
                          }
                        }}
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        onDoubleClick={() => header.column.resetSize()}
                      />
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} data-selected={row.getIsSelected()}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!table.getRowModel().rows.length && (
        <div className="empty-state">
          <div className="empty-icon">
            <Search size={23} />
          </div>
          <h2>No payments found</h2>
          <p>Try a different search or adjust your filters.</p>
          <button className="button" onClick={() => update(defaultQuery)}>
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
