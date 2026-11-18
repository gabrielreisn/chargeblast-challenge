import { EmptyState } from "@/components/feedback/empty-state";
import { buttonStyles } from "@/components/ui/styles";
import { statusLabels, type PaymentStatus } from "./model";

type StatusEmptyStateProps = { status: PaymentStatus; onClear: () => void };

/** Shown in place of the table when a status tab has no payments at all, as Stripe does. */
export function StatusEmptyState({ status, onClear }: StatusEmptyStateProps) {
  const label = statusLabels[status];
  return (
    <EmptyState
      layout="inline"
      title={`No ${label.toLowerCase()} test payments`}
      description={`${label} test payments will show up here.`}
    >
      <button type="button" className={buttonStyles()} onClick={onClear}>
        Clear all
      </button>
    </EmptyState>
  );
}
