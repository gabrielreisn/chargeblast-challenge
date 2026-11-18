import { expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardProviders } from "@/components/dashboard/providers";
import { buildPayment, testFormatSettings, testNow } from "@/test/payments";
import { PaymentDetails } from "./payment-details";

vi.mock("next/navigation", () => import("@/test/next-navigation"));

function renderDetails(...args: Parameters<typeof buildPayment>) {
  const payment = buildPayment(...args);
  render(
    <DashboardProviders>
      <PaymentDetails payment={payment} source="synthetic" formatSettings={testFormatSettings} />
    </DashboardProviders>,
  );
  return payment;
}

function section(name: string) {
  return screen.getByRole("heading", { name }).closest("section") as HTMLElement;
}

test("shows the amount, status, newest-first activity and the read-only actions", () => {
  renderDetails({
    status: "refunded",
    amount: 2500,
    amountRefunded: 2500,
    events: [
      { type: "created", created: testNow - 7200 },
      { type: "succeeded", created: testNow - 7190 },
      { type: "refunded", created: testNow - 60 },
    ],
  });
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("$25.00 USDRefunded");
  expect(screen.getByRole("link", { name: "Transactions" })).toHaveAttribute("href", "/payments");
  expect(screen.getByRole("button", { name: /Refund/ })).toHaveAttribute("aria-disabled", "true");
  expect(
    within(section("Recent activity"))
      .getAllByRole("listitem")
      .map((item) => item.firstElementChild?.nextElementSibling?.textContent),
  ).toEqual(["Payment refunded", "Payment succeeded", "Payment started"]);
});

test("breaks the payment down into fees, refunds and a signed net amount", () => {
  renderDetails({ amount: 2500, amountRefunded: 2500, fee: 103, status: "refunded" });
  const breakdown = within(section("Payment breakdown"));
  expect(breakdown.getByText(/Stripe processing fees/).nextElementSibling).toHaveTextContent(
    "- $1.03 USD",
  );
  expect(breakdown.getByText("Net amount").nextElementSibling).toHaveTextContent("- $1.03 USD");
});

test("explains uncaptured payments, decline reasons and missing risk scores", () => {
  renderDetails({
    status: "failed",
    fee: null,
    failureMessage: "Insufficient funds",
    riskLevel: null,
    riskScore: null,
  });
  expect(screen.getByText(/no fees or net amount/)).toBeVisible();
  expect(screen.getByText("Insufficient funds")).toBeVisible();
  expect(screen.getByText(/Radar didn’t evaluate this payment/)).toBeVisible();
});

test("lists card details, risk, metadata and customer fallbacks", () => {
  renderDetails({
    brand: "visa",
    last4: "4242",
    card: {
      funding: "credit",
      expMonth: 12,
      expYear: 2032,
      fingerprint: "FH40CWe8laEq7lbY",
      country: "US",
      cvcCheck: "pass",
      issuer: "Stripe Payments UK Limited",
    },
    riskLevel: "elevated",
    riskScore: 70,
    metadata: { order_id: "ord_1" },
    customer: { id: null, name: null, email: null },
  });
  const method = within(section("Payment method"));
  expect(method.getByText("Visa credit card")).toBeVisible();
  expect(method.getByText("Expires Dec 2032")).toBeVisible();
  expect(method.getByText("12 / 2032")).toBeVisible();
  expect(method.getByText(/United States/)).toBeVisible();
  expect(method.getByText("Passed")).toBeVisible();
  expect(within(section("Risk analysis")).getByText("Elevated")).toBeVisible();
  expect(screen.getByRole("meter", { name: "Risk score" })).toHaveAttribute("value", "70");
  expect(within(section("Metadata")).getByText("ord_1")).toBeVisible();
  expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Guest customer");
});

test("shows bank details for ACH debits and an empty metadata box", () => {
  renderDetails({
    method: "ach",
    brand: null,
    card: null,
    bankName: "STRIPE TEST BANK",
    metadata: {},
  });
  expect(within(section("Payment method")).getByText("US bank account")).toBeVisible();
  expect(screen.getByText("STRIPE TEST BANK")).toBeVisible();
  expect(screen.getByText("No metadata")).toBeVisible();
});

test("converts a date to the viewer's zone and UTC on hover", async () => {
  const user = userEvent.setup();
  renderDetails({ events: [{ type: "created", created: testNow }] });
  const [date] = within(section("Recent activity")).getAllByRole("button", {
    name: "Nov 17, 2026, 11:00 PM",
  });
  await user.hover(date);
  const popover = await screen.findByRole("tooltip");
  expect(popover).toHaveTextContent("-03 · Your time zone");
  expect(popover).toHaveTextContent("UTC2:00 AMNov 18, 2026");
});
