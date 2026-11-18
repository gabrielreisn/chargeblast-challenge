"use client";
import { useMemo } from "react";
import Link from "next/link";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { ArrowRight, Ellipsis } from "lucide-react";
import type { Formatters } from "./format";
import { cn, menuItemStyles, menuStyles, rowIconButtonStyles } from "@/components/ui/styles";
import { Hint } from "@/components/ui/hint";
import { CopyId, PaymentMethodCell, StatusBadge } from "./ui";
import type { PaymentColumnDef } from "./table-features";
/** Minimum widths were measured in the browser: the widest header or essential cell content. */
export function usePaymentColumns(now: number, format: Formatters) {
  return useMemo<PaymentColumnDef[]>(
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
              // v9: getIsSomeRowsSelected() means "at least one", so exclude the all-selected case.
              if (element)
                element.indeterminate =
                  table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected();
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
        minSize: 104,
        cell: ({ row: { original: p } }) => (
          <Link
            className="group/amount flex w-full items-center justify-end gap-1.5"
            href={`/payments/${p.id}`}
          >
            {/* End-aligned tabular figures line decimals up row to row. */}
            <span className="font-semibold text-ink tabular-nums group-hover/amount:text-brand">
              {format.formatAmount(p.amount, p.currency)}
            </span>
            {/* Fixed width so amounts stay aligned across currency codes of different widths. */}
            <span className="w-6.5 text-subtle">{p.currency.toUpperCase()}</span>
          </Link>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 110,
        minSize: 92,
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "method",
        header: "Payment method",
        size: 155,
        minSize: 130,
        cell: ({ row }) => <PaymentMethodCell payment={row.original} />,
      },
      {
        accessorKey: "description",
        header: "Description",
        size: 170,
        minSize: 80,
        cell: ({ row }) => <span className="text-muted">{row.original.description ?? "—"}</span>,
      },
      {
        id: "customer",
        header: "Customer",
        size: 245,
        minSize: 80,
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
        minSize: 128,
        cell: ({ row }) => <CopyId id={row.original.id} />,
      },
      {
        accessorKey: "created",
        header: "Date",
        size: 175,
        minSize: 100,
        cell: ({ row }) => (
          <Hint text={`${format.relativeTime(row.original.created, now)} · ${format.timeZone}`}>
            <button type="button" className="text-10 text-[#6d788c]">
              <time dateTime={new Date(row.original.created * 1000).toISOString()}>
                {format.formatDate(row.original.created)}
              </time>
            </button>
          </Hint>
        ),
      },
      {
        id: "refunded",
        header: "Refunded amount",
        size: 140,
        minSize: 105,
        cell: ({ row: { original: p } }) =>
          p.amountRefunded ? (
            <span className="tabular-nums">
              {format.formatAmount(p.amountRefunded, p.currency)} {p.currency.toUpperCase()}
            </span>
          ) : (
            "—"
          ),
      },
      {
        id: "customerName",
        header: "Customer name",
        size: 170,
        minSize: 96,
        cell: ({ row }) => row.original.customer.name ?? "—",
      },
      {
        // The status as Stripe reports it, before it is grouped into the four dashboard statuses.
        accessorKey: "sourceStatus",
        header: "Intent status",
        size: 170,
        minSize: 80,
        cell: ({ row }) => (
          <code className="font-mono text-10 text-muted">{row.original.sourceStatus}</code>
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
              className={cn(rowIconButtonStyles, "opacity-50 group-hover/row:opacity-100")}
              aria-label={`Actions for payment ${row.original.id}`}
            >
              <Ellipsis size={15} />
            </Dropdown.Trigger>
            <Dropdown.Portal>
              <Dropdown.Content className={menuStyles} align="end">
                <Dropdown.Item asChild className={menuItemStyles}>
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
    [now, format],
  );
}
