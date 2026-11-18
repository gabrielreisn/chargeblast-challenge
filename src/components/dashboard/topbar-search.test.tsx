import { beforeEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopbarSearch } from "./topbar-search";

vi.mock("next/navigation", () => import("@/test/next-navigation"));
beforeEach(() => window.history.replaceState(null, "", "/payouts"));

test("outside the payments list, Enter opens payments with the whole search applied", async () => {
  const user = userEvent.setup();
  render(<TopbarSearch />);
  await user.type(screen.getByRole("textbox", { name: "Search payments" }), "4242");
  expect(window.location.pathname).toBe("/payouts");
  await user.keyboard("{Enter}");
  expect(window.location.pathname + window.location.search).toBe("/payments?q=4242");
  expect(screen.getByRole("textbox", { name: "Search payments" })).toHaveValue("4242");
});

test("on the payments list, typing filters in place without adding history entries", async () => {
  window.history.replaceState(null, "", "/payments?status=failed&page=3");
  const user = userEvent.setup();
  const length = window.history.length;
  render(<TopbarSearch />);
  await user.type(screen.getByRole("textbox", { name: "Search payments" }), "visa");
  expect(window.location.search).toBe("?q=visa&status=failed");
  expect(window.history.length).toBe(length);
});
