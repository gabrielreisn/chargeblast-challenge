"use client";
import { ErrorState, type ErrorBoundaryProps } from "@/components/feedback/error-state";

// Scoped below the transactions layout: the title and tabs stay interactive so
// people can switch to another transaction type while one view is failing.
export default function TransactionsError(props: ErrorBoundaryProps) {
  return (
    <ErrorState
      {...props}
      title="Transactions couldn’t be loaded"
      description="Something went wrong while loading this view. Try again, or switch to another tab."
    />
  );
}
