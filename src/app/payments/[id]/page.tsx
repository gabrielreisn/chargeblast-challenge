import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { PaymentDetails } from "@/features/payments/payment-details";
import { getPaymentsData } from "@/lib/payments-data";
async function DetailsContent({ params }: Pick<PageProps<"/payments/[id]">, "params">) {
  await connection();
  const [{ id }, snapshot] = await Promise.all([params, getPaymentsData()]);
  const payment = snapshot.payments.find((p) => p.id === id);
  if (!payment) notFound();
  return <PaymentDetails payment={payment} synthetic={snapshot.source === "synthetic"} />;
}
export default function DetailsPage({ params }: PageProps<"/payments/[id]">) {
  return (
    <Suspense fallback={<div className="loading-screen">Loading payment…</div>}>
      <DetailsContent params={params} />
    </Suspense>
  );
}
