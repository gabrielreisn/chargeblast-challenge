import { Suspense } from "react";
import { connection } from "next/server";
import { LoadingState } from "@/components/feedback/loading-state";
import { PaymentsScreen } from "@/features/payments/payments-screen";
import { getFormatSettings } from "@/lib/format-settings";
import { getPaymentsData } from "@/lib/payments-data";
import { routeMetadata } from "@/lib/seo";

export const metadata = routeMetadata("payments");

async function PaymentsContent() {
  await connection();
  const [snapshot, formatSettings] = await Promise.all([getPaymentsData(), getFormatSettings()]);
  const now = Math.floor(Date.now() / 1000);
  return (
    <Suspense fallback={<LoadingState label="Loading view…" />}>
      <PaymentsScreen snapshot={snapshot} now={now} formatSettings={formatSettings} />
    </Suspense>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading payments…" />}>
      <PaymentsContent />
    </Suspense>
  );
}
