import { expect, test } from "vitest";
import { buildPayment } from "@/test/payments";
import { csvForPayments } from "./csv";

test("exports escaped, formula-safe CSV with a header row", () => {
  const csv = csvForPayments([
    buildPayment({ customer: { id: null, name: "x", email: '=SUM(1,2)"@example.com' } }),
  ]);
  expect(csv).toContain('"\'=SUM(1,2)""@example.com"');
  expect(csv.split("\r\n")).toHaveLength(2);
  expect(csv.startsWith('"Payment ID","Customer"')).toBe(true);
});
