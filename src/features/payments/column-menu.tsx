"use client";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { ArrowLeft, ArrowRight, Columns3, ChevronDown, Check } from "lucide-react";
import {
  buttonStyles,
  iconButtonStyles,
  menuItemStyles,
  menuLabelStyles,
  menuSeparatorStyles,
  menuStyles,
} from "@/components/ui/styles";
import type { MoveColumn } from "./payment-table";
import type { PaymentTable } from "./table-features";

type ColumnMenuProps = { table: PaymentTable; moveColumn: MoveColumn };

export function ColumnMenu({ table, moveColumn }: ColumnMenuProps) {
  "use no memo";
  const { columnOrder, columnVisibility } = table.state;
  return (
    <Dropdown.Root>
      <Dropdown.Trigger className={buttonStyles({ size: "sm" })}>
        <Columns3 size={12} aria-hidden="true" />
        <span>Edit columns</span>
        <ChevronDown size={11} aria-hidden="true" />
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content className={menuStyles} align="end">
          <Dropdown.Label className={menuLabelStyles}>Reorder columns</Dropdown.Label>
          <p className="mb-2 px-2 text-10 leading-4 text-[#8490a0]">
            Drag table headings or use the arrows.
          </p>
          {table
            .getAllLeafColumns()
            .filter((column) => !["select", "actions"].includes(column.id))
            .sort((a, b) => columnOrder.indexOf(a.id) - columnOrder.indexOf(b.id))
            .map((column) => {
              const index = columnOrder.indexOf(column.id);
              const label = column.columnDef.header as string;
              return (
                <div className="flex items-center gap-1 px-2 py-1.25 text-11" key={column.id}>
                  <span className="flex-1">{label}</span>
                  <button
                    type="button"
                    className={iconButtonStyles}
                    aria-label={`Move ${label} left`}
                    disabled={index <= 1}
                    onClick={() => moveColumn(column.id, columnOrder[index - 1])}
                  >
                    <ArrowLeft size={13} />
                  </button>
                  <button
                    type="button"
                    className={iconButtonStyles}
                    aria-label={`Move ${label} right`}
                    disabled={index >= columnOrder.length - 2}
                    onClick={() => moveColumn(column.id, columnOrder[index + 1])}
                  >
                    <ArrowRight size={13} />
                  </button>
                </div>
              );
            })}
          <Dropdown.Separator className={menuSeparatorStyles} />
          <Dropdown.CheckboxItem
            className={menuItemStyles}
            checked={columnVisibility.description}
            onCheckedChange={(checked) => table.setColumnVisibility({ description: checked })}
          >
            Show description
            <Dropdown.ItemIndicator>
              <Check size={12} aria-hidden="true" />
            </Dropdown.ItemIndicator>
          </Dropdown.CheckboxItem>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
