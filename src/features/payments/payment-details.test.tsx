import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardProviders } from "@/components/dashboard/providers";
import { buildPayment, testFormatSettings } from "@/test/payments";
import { PaymentDetails } from "./payment-details";

vi.mock("next/navigation", () => import("@/test/next-navigation"));

test("shows payment facts, the refund row and the source's activity note", () => {
  const payment = buildPayment({
    status: "refunded",
    amount: 2500,
    amountRefunded: 1000,
    customer: { id: null, name: null, email: null },
  });
  render(
    <DashboardProviders>
      <PaymentDetails payment={payment} source="stripe-api" formatSettings={testFormatSettings} />
    </DashboardProviders>,
  );
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("$25.00 USD");
  expect(screen.getByText("Amount refunded").nextSibling).toHaveTextContent("$10.00");
  expect(screen.getByText(/Current state from Stripe/)).toBeVisible();
  expect(screen.getByText("Live from Stripe sandbox")).toBeVisible();
  // Customer fallbacks when Stripe has no customer details.
  expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Guest customer");
  expect(screen.getByText("No email provided")).toBeVisible();
});

test("labels the synthetic fixture as illustrative demo data", () => {
  render(
    <DashboardProviders>
      <PaymentDetails
        payment={buildPayment()}
        source="synthetic"
        formatSettings={testFormatSettings}
      />
    </DashboardProviders>,
  );
  expect(screen.getByText(/Illustrative demo timeline/)).toBeVisible();
  expect(screen.getByText("Synthetic demo fixture")).toBeVisible();
  expect(screen.queryByText("Amount refunded")).not.toBeInTheDocument();
});
