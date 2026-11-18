"use client";
import { useMemo } from "react";
import Link from "next/link";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { ArrowRight, Ellipsis } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Payment } from "./model";
import { formatAmount, formatDate, relativeTime, TIME_ZONE } from "./query";
import { CopyId, Hint, PaymentMethodCell, StatusBadge } from "./ui";
export function usePaymentColumns(now: number) {
  return useMemo<ColumnDef<Payment>[]>(
    () => [
      {
        id: "select",
        size: 30,
        minSize: 30,
        maxSize: 30,
        enableResizing: false,
        header: ({ table }) => (
          <input
            type="checkbox"
            aria-label="Select this page"
            checked={table.getIsAllRowsSelected()}
            ref={(element) => {
              if (element) element.indeterminate = table.getIsSomeRowsSelected();
            }}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={`Select payment ${row.original.id}`}
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        size: 125,
        minSize: 110,
        cell: ({ row: { original: p } }) => (
          <Link className="amount-cell" href={`/payments/${p.id}`}>
            {formatAmount(p.amount, p.currency)}
            <span className="currency">{p.currency.toUpperCase()}</span>
          </Link>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 110,
        minSize: 100,
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "method",
        header: "Payment method",
        size: 155,
        minSize: 135,
        cell: ({ row }) => <PaymentMethodCell payment={row.original} />,
      },
      {
        accessorKey: "description",
        header: "Description",
        size: 170,
        minSize: 120,
        cell: ({ row }) => <span className="muted">{row.original.description ?? "—"}</span>,
      },
      {
        id: "customer",
        header: "Customer",
        size: 245,
        minSize: 170,
        cell: ({ row }) => (
          <span title={row.original.customer.email ?? row.original.customer.name ?? ""}>
            {row.original.customer.email ?? row.original.customer.name ?? "Guest customer"}
          </span>
        ),
      },
      {
        accessorKey: "id",
        header: "Payment ID",
        size: 175,
        minSize: 155,
        cell: ({ row }) => <CopyId id={row.original.id} />,
      },
      {
        accessorKey: "created",
        header: "Date",
        size: 175,
        minSize: 160,
        cell: ({ row }) => (
          <Hint text={`${relativeTime(row.original.created, now)} · ${TIME_ZONE}`}>
            <button className="date-cell">
              <time dateTime={new Date(row.original.created * 1000).toISOString()}>
                {formatDate(row.original.created)}
              </time>
            </button>
          </Hint>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 35,
        minSize: 35,
        maxSize: 35,
        enableResizing: false,
        cell: ({ row }) => (
          <Dropdown.Root>
            <Dropdown.Trigger
              className="icon-button row-actions"
              aria-label={`Actions for payment ${row.original.id}`}
            >
              <Ellipsis size={15} />
            </Dropdown.Trigger>
            <Dropdown.Portal>
              <Dropdown.Content className="menu" align="end">
                <Dropdown.Item asChild>
                  <Link href={`/payments/${row.original.id}`}>
                    View payment details <ArrowRight size={13} />
                  </Link>
                </Dropdown.Item>
              </Dropdown.Content>
            </Dropdown.Portal>
          </Dropdown.Root>
        ),
      },
    ],
    [now],
  );
}
