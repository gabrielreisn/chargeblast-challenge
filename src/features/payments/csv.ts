import { majorAmount } from "./format";
import type { Payment } from "./model";

const headers = [
  "Payment ID",
  "Customer",
  "Amount",
  "Currency",
  "Status",
  "Payment method",
  "Last 4",
  "Created",
];

/** Quotes a CSV field and neutralizes spreadsheet formula prefixes (=, +, @, -). */
function escapeCsvField(value: string) {
  const formulaGuard = /^[=+@\-\t\r\n]/.test(value) ? "'" : "";
  return `"${formulaGuard}${value.replaceAll('"', '""')}"`;
}

function toRow(payment: Payment) {
  return [
    payment.id,
    payment.customer.email ?? payment.customer.name ?? "",
    String(majorAmount(payment.amount, payment.currency)),
    payment.currency.toUpperCase(),
    payment.status,
    payment.method,
    payment.last4 ?? "",
    new Date(payment.created * 1000).toISOString(),
  ];
}

/** CSV for every given payment (the whole filtered view, not just the current page). */
export function csvForPayments(payments: Payment[]) {
  return [headers, ...payments.map(toRow)]
    .map((row) => row.map(escapeCsvField).join(","))
    .join("\r\n");
}
