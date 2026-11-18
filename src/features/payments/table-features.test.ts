import { expect, test } from "vitest";
import { reorderColumns } from "./table-features";

const order = ["select", "amount", "status", "method", "created", "actions"];

test("moves a column to its target's position in either direction", () => {
  expect(reorderColumns(order, "amount", "method")).toEqual([
    "select",
    "status",
    "method",
    "amount",
    "created",
    "actions",
  ]);
  expect(reorderColumns(order, "created", "status")).toEqual([
    "select",
    "amount",
    "created",
    "status",
    "method",
    "actions",
  ]);
});

test("can move a column to the last reorderable position", () => {
  expect(reorderColumns(order, "amount", "created").at(-2)).toBe("amount");
});

test("never moves pinned columns or changes the order for no-op moves", () => {
  expect(reorderColumns(order, "select", "method")).toBe(order);
  expect(reorderColumns(order, "amount", "actions")).toBe(order);
  expect(reorderColumns(order, "status", "status")).toBe(order);
  expect(reorderColumns(order, "missing", "status")).toBe(order);
});
