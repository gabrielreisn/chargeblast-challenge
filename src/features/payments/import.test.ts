// @vitest-environment node
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type Stripe from "stripe";
import { afterEach, expect, test } from "vitest";
import { importPayments } from "../../../scripts/import-payments";
const directories: string[] = [];
afterEach(async () => {
  await Promise.all(directories.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});
async function destination() {
  const dir = await mkdtemp(join(tmpdir(), "payments-import-"));
  directories.push(dir);
  return join(dir, "payments.json");
}
const payment = {
  id: "pi_test",
  amount: 1000,
  currency: "usd",
  status: "succeeded",
  livemode: false,
  created: 1700000000,
  customer: null,
  payment_method: null,
  latest_charge: null,
  description: null,
  client_secret: "must-not-export",
};
function client(generator: () => AsyncGenerator<unknown>) {
  return { paymentIntents: { list: generator } } as unknown as Pick<Stripe, "paymentIntents">;
}
test("imports the SDK async iterator and writes only normalized data", async () => {
  const path = await destination();
  const count = await importPayments(
    client(async function* () {
      yield payment;
      yield { ...payment, id: "pi_next" };
    }),
    path,
  );
  expect(count).toBe(2);
  const json = JSON.parse(await readFile(path, "utf8"));
  expect(json.source).toBe("stripe-sandbox");
  expect(json.payments.map((p: { id: string }) => p.id)).toEqual(["pi_test", "pi_next"]);
  expect(JSON.stringify(json)).not.toContain("must-not-export");
});
test("preserves the previous snapshot if a later API page fails", async () => {
  const path = await destination();
  await writeFile(path, "previous-snapshot");
  await expect(
    importPayments(
      client(async function* () {
        yield payment;
        throw new Error("rate limited");
      }),
      path,
    ),
  ).rejects.toThrow("rate limited");
  expect(await readFile(path, "utf8")).toBe("previous-snapshot");
});
test("caps imports at 1000 and aborts on live data before writing", async () => {
  const path = await destination();
  expect(
    await importPayments(
      client(async function* () {
        for (let i = 0; i < 1005; i++) yield { ...payment, id: `pi_${i}` };
      }),
      path,
    ),
  ).toBe(1000);
  await expect(
    importPayments(
      client(async function* () {
        yield { ...payment, livemode: true };
      }),
      path,
    ),
  ).rejects.toThrow("Live payments");
  expect(JSON.parse(await readFile(path, "utf8")).payments).toHaveLength(1000);
});
