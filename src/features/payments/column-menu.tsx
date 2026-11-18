"use client";
import * as Popover from "@radix-ui/react-popover";
import { ArrowDown, ArrowUp, Settings, X } from "lucide-react";
import {
  buttonStyles,
  cn,
  floatingPanelStyles,
  iconButtonStyles,
  noteStyles,
  textButtonStyles,
} from "@/components/ui/styles";
import { fixedColumnIds, type MoveColumn, type PaymentTable } from "./table-features";

type ColumnMenuProps = { table: PaymentTable; moveColumn: MoveColumn };

/**
 * Column settings: a checkbox per column adds or removes it from the table, the arrows move it
 * (as does dragging a heading), and reset restores the default layout. At least one data
 * column always stays visible.
 */
export function ColumnMenu({ table, moveColumn }: ColumnMenuProps) {
  "use no memo";
  const { columnOrder } = table.state;
  const columns = table
    .getAllLeafColumns()
    .filter((column) => !fixedColumnIds.includes(column.id))
    .toSorted((a, b) => columnOrder.indexOf(a.id) - columnOrder.indexOf(b.id));
  const visibleCount = columns.filter((column) => column.getIsVisible()).length;
  return (
    <Popover.Root>
      <Popover.Trigger className={buttonStyles({ size: "sm" })}>
        <Settings size={12} aria-hidden="true" />
        Edit columns
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className={cn(floatingPanelStyles, "w-67.5 max-w-[calc(100vw-30px)]")}
          align="end"
          sideOffset={6}
        >
          <div className="flex items-center justify-between border-b border-[#e9ecf1] px-3.5 py-3 text-12 font-semibold">
            Edit columns
            <Popover.Close className={iconButtonStyles} aria-label="Close column settings">
              <X size={14} />
            </Popover.Close>
          </div>
          <fieldset className="px-1.5 py-1.5">
            <legend className="sr-only">Visible columns</legend>
            {columns.map((column, position) => {
              const label = column.columnDef.header as string;
              const visible = column.getIsVisible();
              return (
                <div
                  key={column.id}
                  className="flex items-center gap-1 rounded py-1 pr-1 pl-2 hover:bg-wash"
                >
                  <label className="flex flex-1 cursor-pointer items-center gap-2.5 py-0.5 text-12">
                    <input
                      type="checkbox"
                      checked={visible}
                      disabled={visible && visibleCount === 1}
                      onChange={(event) => column.toggleVisibility(event.target.checked)}
                    />
                    {label}
                  </label>
                  <button
                    type="button"
                    className={iconButtonStyles}
                    aria-label={`Move ${label} up`}
                    disabled={position === 0}
                    onClick={() => moveColumn(column.id, columns[position - 1].id)}
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    type="button"
                    className={iconButtonStyles}
                    aria-label={`Move ${label} down`}
                    disabled={position === columns.length - 1}
                    onClick={() => moveColumn(column.id, columns[position + 1].id)}
                  >
                    <ArrowDown size={13} />
                  </button>
                </div>
              );
            })}
          </fieldset>
          <div className="flex items-center justify-between gap-3 border-t border-[#e9ecf1] px-3.5 py-2">
            <p className={noteStyles}>You can also drag table headings.</p>
            <button
              type="button"
              className={textButtonStyles}
              onClick={() => {
                // Both reset to the table's `initialState` (see payments-screen.tsx).
                table.resetColumnOrder();
                table.resetColumnVisibility();
              }}
            >
              Reset
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
