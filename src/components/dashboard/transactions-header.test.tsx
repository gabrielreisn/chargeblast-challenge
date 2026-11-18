import { beforeEach, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { DashboardProviders } from "./providers";
import { TransactionsHeader } from "./transactions-header";

vi.mock("next/navigation", () => import("@/test/next-navigation"));
beforeEach(() => window.history.replaceState(null, "", "/payouts"));

test("links every transaction tab and marks the current route", () => {
  render(
    <DashboardProviders>
      <TransactionsHeader />
    </DashboardProviders>,
  );
  const tabs = within(screen.getByRole("navigation", { name: "Transaction type" }));
  expect(
    tabs.getAllByRole("link").map((link) => [link.textContent, link.getAttribute("href")]),
  ).toEqual([
    ["Payments", "/payments"],
    ["Payouts", "/payouts"],
    ["Top-ups", "/topups"],
    ["Standalone 3DS", "/standalone-3ds"],
    ["All activity", "/activity"],
  ]);
  expect(tabs.getByRole("link", { current: "page" })).toHaveTextContent("Payouts");
  expect(screen.getByRole("button", { name: /New payout/ })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  expect(screen.queryByRole("button", { name: /Create payment/ })).not.toBeInTheDocument();
});
