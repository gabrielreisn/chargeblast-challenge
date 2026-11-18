import { BanknoteArrowDown } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { routeMetadata } from "@/lib/seo";

export const metadata = routeMetadata("topups");

export default function TopupsPage() {
  return (
    <EmptyState
      icon={<BanknoteArrowDown size={18} />}
      title="No test top-ups"
      description="Top-ups add funds from your bank account to your Stripe balance. They’ll show up here once you create one."
      learnMoreHref="https://docs.stripe.com/connect/top-ups"
    />
  );
}
