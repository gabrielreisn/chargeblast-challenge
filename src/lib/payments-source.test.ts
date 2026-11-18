import { expect, test } from "vitest";
import { parsePaymentsSource } from "./payments-source";

test("defaults to the local source and accepts known sources case-insensitively", () => {
  expect(parsePaymentsSource(undefined)).toBe("local");
  expect(parsePaymentsSource("")).toBe("local");
  expect(parsePaymentsSource(" Remote ")).toBe("remote");
  expect(parsePaymentsSource("local")).toBe("local");
});

test("rejects unknown sources with the accepted values", () => {
  expect(() => parsePaymentsSource("stripe")).toThrow('Use "local" or "remote"');
});
