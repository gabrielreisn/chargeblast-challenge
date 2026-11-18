"use client";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { ArrowLeft, ArrowRight, Columns3, ChevronDown, Check } from "lucide-react";
import type { Table } from "@tanstack/react-table";
import type { Payment } from "./model";
export function ColumnMenu({
  table,
  moveColumn,
}: {
  table: Table<Payment>;
  moveColumn: (id: string, target: string) => void;
}) {
  "use no memo";
  const columnOrder = table.getState().columnOrder;
  return (
    <Dropdown.Root>
      <Dropdown.Trigger className="button small">
        <Columns3 size={12} />
        <span>Edit columns</span>
        <ChevronDown size={11} />
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content className="menu columns-menu" align="end">
          <Dropdown.Label className="menu-label">Reorder columns</Dropdown.Label>
          <p className="filter-note">Drag table headings or use the arrows.</p>
          {table
            .getAllLeafColumns()
            .filter((c) => !["select", "actions"].includes(c.id))
            .sort((a, b) => columnOrder.indexOf(a.id) - columnOrder.indexOf(b.id))
            .map((c) => (
              <div className="column-setting" key={c.id}>
                <span>{c.columnDef.header as string}</span>
                <button
                  className="icon-button"
                  aria-label={`Move ${c.columnDef.header} left`}
                  disabled={columnOrder.indexOf(c.id) <= 1}
                  onClick={() => moveColumn(c.id, columnOrder[columnOrder.indexOf(c.id) - 1])}
                >
                  <ArrowLeft size={13} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Move ${c.columnDef.header} right`}
                  disabled={columnOrder.indexOf(c.id) >= columnOrder.length - 2}
                  onClick={() => moveColumn(columnOrder[columnOrder.indexOf(c.id) + 1], c.id)}
                >
                  <ArrowRight size={13} />
                </button>
              </div>
            ))}
          <Dropdown.Separator className="menu-divider" />
          <Dropdown.CheckboxItem
            checked={table.getState().columnVisibility.description}
            onCheckedChange={(checked) => table.setColumnVisibility({ description: checked })}
          >
            <Dropdown.ItemIndicator>
              <Check size={12} />
            </Dropdown.ItemIndicator>
            Show description
          </Dropdown.CheckboxItem>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
