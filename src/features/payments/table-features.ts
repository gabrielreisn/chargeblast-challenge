import {
  columnOrderingFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  rowSelectionFeature,
  tableFeatures,
  type ColumnDef,
  type Header,
  type ReactTable,
} from "@tanstack/react-table";
import type { Payment } from "./model";

/**
 * TanStack Table v9 features are opt-in. Register every feature whose APIs the
 * payments table uses; sizing must precede resizing. Filtering, sorting and
 * pagination run in `queryPayments` (URL state), not in the table.
 */
export const paymentTableFeatures = tableFeatures({
  rowSelectionFeature,
  columnOrderingFeature,
  columnVisibilityFeature,
  columnSizingFeature,
  columnResizingFeature,
});

type PaymentTableFeatures = typeof paymentTableFeatures;
/** The React adapter table, which adds reactive `state` on top of the core table API. */
export type PaymentTable = ReactTable<PaymentTableFeatures, Payment>;
export type PaymentColumnDef = ColumnDef<PaymentTableFeatures, Payment>;
export type PaymentHeader = Header<PaymentTableFeatures, Payment, unknown>;

/** Moves a column to another column's position (see `reorderColumns`). */
export type MoveColumn = (id: string, target: string) => void;

/** Selection and row-action columns stay pinned to the edges and can't be reordered. */
export const fixedColumnIds = ["select", "actions"];

/**
 * Moves `activeId` to the position of `targetId` (array-move semantics), so a
 * column can land before or after its neighbor. Fixed columns never move.
 */
export function reorderColumns(order: string[], activeId: string, targetId: string): string[] {
  if (activeId === targetId) return order;
  if (fixedColumnIds.includes(activeId) || fixedColumnIds.includes(targetId)) return order;
  const from = order.indexOf(activeId);
  const to = order.indexOf(targetId);
  if (from < 0 || to < 0) return order;
  const next = [...order];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
}
