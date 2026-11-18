import { BanknoteArrowUp, Lightbulb, Plus } from "lucide-react";
import { Banner } from "@/components/dashboard/banner";
import { ReadOnlyButton } from "@/components/dashboard/read-only-button";
import { EmptyState } from "@/components/feedback/empty-state";
import { routeMetadata } from "@/lib/seo";

export const metadata = routeMetadata("payouts");

export default function PayoutsPage() {
  return (
    <>
      <Banner
        icon={<Lightbulb size={14} aria-hidden="true" />}
        action={{ label: "Explore Stripe Tax", href: "https://stripe.com/tax" }}
      >
        Businesses like yours automate sales tax compliance including registration, collection and
        filing with Stripe Tax.
      </Banner>
      <EmptyState
        icon={<BanknoteArrowUp size={18} />}
        title="No test payouts"
        description="Test payouts will show up here, along with the date they’re expected to arrive in your bank account."
        learnMoreHref="https://docs.stripe.com/payouts"
      >
        <ReadOnlyButton primary>
          <Plus size={13} aria-hidden="true" />
          Create your first payout
        </ReadOnlyButton>
      </EmptyState>
    </>
  );
}
