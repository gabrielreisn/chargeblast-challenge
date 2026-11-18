import { Suspense } from "react";
import { connection } from "next/server";
import { PaymentsScreen } from "@/features/payments/payments-screen";
import { getPaymentsData } from "@/lib/payments-data";

async function PaymentsContent() {
  await connection();
  const snapshot = await getPaymentsData();
  const now = Math.floor(Date.now() / 1000);
  return (
    <Suspense fallback={<div className="loading-screen">Loading view…</div>}>
      <PaymentsScreen snapshot={snapshot} now={now} />
    </Suspense>
  );
}
export default function PaymentsPage() {
  return (
    <Suspense fallback={<div className="loading-screen">Loading payments…</div>}>
      <PaymentsContent />
    </Suspense>
  );
}
