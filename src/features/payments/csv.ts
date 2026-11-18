import { majorAmount } from "./format";
import type { Payment } from "./model";

type CsvField = { header: string; value: (payment: Payment) => string };

/**
 * CSV fields for each table column id. Values are machine-readable, not display strings:
 * plain decimal amounts, raw status and method codes, ISO 8601 UTC timestamps. Amount and
 * payment method split into two fields so the currency and last 4 stay sortable.
 */
const csvFieldsByColumn: Record<string, CsvField[]> = {
  amount: [
    { header: "Amount", value: (p) => String(majorAmount(p.amount, p.currency)) },
    { header: "Currency", value: (p) => p.currency.toUpperCase() },
  ],
  status: [{ header: "Status", value: (p) => p.status }],
  method: [
    { header: "Payment method", value: (p) => p.method },
    { header: "Last 4", value: (p) => p.last4 ?? "" },
  ],
  description: [{ header: "Description", value: (p) => p.description ?? "" }],
  customer: [{ header: "Customer", value: (p) => p.customer.email ?? p.customer.name ?? "" }],
  id: [{ header: "Payment ID", value: (p) => p.id }],
  created: [{ header: "Created", value: (p) => new Date(p.created * 1000).toISOString() }],
  refunded: [
    { header: "Refunded amount", value: (p) => String(majorAmount(p.amountRefunded, p.currency)) },
  ],
  customerName: [{ header: "Customer name", value: (p) => p.customer.name ?? "" }],
  sourceStatus: [{ header: "Intent status", value: (p) => p.sourceStatus }],
};

/** Quotes a CSV field and neutralizes spreadsheet formula prefixes (=, +, @, -). */
function escapeCsvField(value: string) {
  const formulaGuard = /^[=+@\-\t\r\n]/.test(value) ? "'" : "";
  return `"${formulaGuard}${value.replaceAll('"', '""')}"`;
}

/**
 * CSV of `payments` with the given table columns, in order. Ids without CSV fields
 * (row selection, actions) are skipped.
 */
export function csvForPayments(payments: Payment[], columnIds: string[]) {
  const fields = columnIds.flatMap((id) => csvFieldsByColumn[id] ?? []);
  return [
    fields.map((field) => field.header),
    ...payments.map((p) => fields.map((field) => field.value(p))),
  ]
    .map((row) => row.map(escapeCsvField).join(","))
    .join("\r\n");
}
