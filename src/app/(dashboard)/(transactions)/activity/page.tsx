import { ArrowLeftRight } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { routeMetadata } from "@/lib/seo";

export const metadata = routeMetadata("activity");

export default function ActivityPage() {
  return (
    <EmptyState
      icon={<ArrowLeftRight size={18} />}
      title="No test activity"
      description="Charges, refunds, payouts, fees and other balance transactions will show up here."
      learnMoreHref="https://docs.stripe.com/reports/balance"
    />
  );
}
