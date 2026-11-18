import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { PageTransition } from "@/components/dashboard/route-transitions";
import { LoadingState } from "@/components/feedback/loading-state";
import { PaymentDetails } from "@/features/payments/payment-details";
import { getPaymentsData } from "@/lib/payments-data";
import { privateMetadata } from "@/lib/seo";

// Individual payment records are for signed-in people, not search engines.
export const metadata = privateMetadata("Payment details");

type DetailsContentProps = Pick<PageProps<"/payments/[id]">, "params">;

async function DetailsContent({ params }: DetailsContentProps) {
  await connection();
  const [{ id }, snapshot] = await Promise.all([params, getPaymentsData()]);
  const payment = snapshot.payments.find((p) => p.id === id);
  if (!payment) notFound();
  return <PaymentDetails payment={payment} source={snapshot.source} />;
}

export default function DetailsPage({ params }: PageProps<"/payments/[id]">) {
  return (
    <PageTransition>
      <div>
        <Suspense fallback={<LoadingState label="Loading payment…" />}>
          <DetailsContent params={params} />
        </Suspense>
      </div>
    </PageTransition>
  );
}
