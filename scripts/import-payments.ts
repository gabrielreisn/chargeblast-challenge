import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type Stripe from "stripe";
import { normalizePayment } from "../src/features/payments/normalize.ts";
import { snapshotSchema } from "../src/features/payments/model.ts";

export async function importPayments(
  stripe: Pick<Stripe, "paymentIntents">,
  path = "data/stripe-payments.local.json",
) {
  const payments = [];
  for await (const pi of stripe.paymentIntents.list({
    limit: 100,
    created: { lte: Math.floor(Date.now() / 1000) },
    expand: ["data.customer", "data.latest_charge", "data.payment_method"],
  })) {
    payments.push(normalizePayment(pi));
    if (payments.length === 1000) break;
  }
  const snapshot = snapshotSchema.parse({
    schemaVersion: 1,
    source: "stripe-sandbox",
    importedAt: new Date().toISOString(),
    payments,
  });
  // No file is touched until every API page has succeeded and all records validate.
  await mkdir(dirname(path), { recursive: true });
  await writeFile(`${path}.tmp`, JSON.stringify(snapshot, null, 2) + "\n", { mode: 0o600 });
  await rename(`${path}.tmp`, path);
  return snapshot.payments.length;
}
