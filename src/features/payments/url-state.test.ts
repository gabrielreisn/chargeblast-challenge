import { expect, test } from "vitest";
import type { Payment } from "./model";
import { defaultQuery, parseQuery, paymentsHref, serializeQuery } from "./url-state";

test("round-trips shared URLs and ignores malformed inputs without crashing", () => {
  const query = {
    ...defaultQuery,
    statuses: ["failed", "pending"] as Payment["status"][],
    page: 3,
    size: 50 as const,
    min: "1.25",
  };
  expect(parseQuery(new URLSearchParams(serializeQuery(query)))).toEqual(query);
  expect(
    parseQuery(
      new URLSearchParams("from=2026-99-99&size=999&page=-3&status=bogus&sort=nope&min=-2"),
    ),
  ).toMatchObject({ from: "", size: 25, page: 1, statuses: [], sort: "created", min: "" });
});

test("drops a reversed amount range and keeps URLs short for defaults", () => {
  expect(parseQuery(new URLSearchParams("min=50&max=10"))).toMatchObject({ min: "", max: "" });
  expect(paymentsHref(defaultQuery)).toBe("/payments");
  expect(paymentsHref({ ...defaultQuery, search: "4242", page: 2 })).toBe(
    "/payments?q=4242&page=2",
  );
});
