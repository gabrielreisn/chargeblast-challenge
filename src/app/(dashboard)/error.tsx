"use client";
import { ErrorState, type ErrorBoundaryProps } from "@/components/feedback/error-state";

// Catches failures in dashboard pages that sit outside a narrower boundary
// (for example payment details) while keeping the sidebar and top bar usable.
export default function DashboardError(props: ErrorBoundaryProps) {
  return <ErrorState {...props} headingLevel="h1" />;
}
