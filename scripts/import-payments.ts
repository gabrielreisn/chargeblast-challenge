import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import {
  fetchStripeSnapshot,
  type StripePaymentsClient,
} from "../src/features/payments/stripe-source.ts";

export async function importPayments(
  stripe: StripePaymentsClient,
  path = "data/stripe-payments.local.json",
) {
  const snapshot = await fetchStripeSnapshot(stripe, { source: "stripe-sandbox" });
  // No file is touched until every API page has succeeded and all records validate.
  await mkdir(dirname(path), { recursive: true });
  await writeFile(`${path}.tmp`, JSON.stringify(snapshot, null, 2) + "\n", { mode: 0o600 });
  await rename(`${path}.tmp`, path);
  return snapshot.payments.length;
}
