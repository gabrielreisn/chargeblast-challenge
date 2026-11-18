import { ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { routeMetadata } from "@/lib/seo";

export const metadata = routeMetadata("standalone-3ds");

export default function Standalone3dsPage() {
  return (
    <EmptyState
      icon={<ShieldCheck size={18} />}
      title="No test 3DS authentications"
      description="3D Secure authentications you run outside of a Stripe payment will show up here."
      learnMoreHref="https://docs.stripe.com/payments/3d-secure/standalone-three-d-secure"
    />
  );
}
