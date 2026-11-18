import { expect, test } from "vitest";
import { buildPayment } from "@/test/payments";
import { csvForPayments } from "./csv";

test("exports escaped, formula-safe CSV with a header row", () => {
  const csv = csvForPayments(
    [buildPayment({ customer: { id: null, name: "x", email: '=SUM(1,2)"@example.com' } })],
    ["id", "customer"],
  );
  expect(csv).toContain('"\'=SUM(1,2)""@example.com"');
  expect(csv.split("\r\n")).toHaveLength(2);
  expect(csv.startsWith('"Payment ID","Customer"')).toBe(true);
});

test("exports only the given columns, in order, skipping ids without CSV fields", () => {
  const payment = buildPayment({
    amount: 1250,
    currency: "jpy",
    amountRefunded: 250,
    last4: "4242",
  });
  const [header, row] = csvForPayments(
    [payment],
    ["select", "refunded", "amount", "method", "actions"],
  ).split("\r\n");
  expect(header).toBe('"Refunded amount","Amount","Currency","Payment method","Last 4"');
  expect(row).toBe(`"250","1250","JPY","${payment.method}","4242"`);
});
