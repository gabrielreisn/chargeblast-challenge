import { expect, test } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardProviders } from "./providers";
import { ProductsNav, products } from "./products-nav";
import { UNAVAILABLE_HINT } from "./unavailable-nav-link";

const productTriggers = () =>
  screen.getAllByRole("button").filter((button) => button.hasAttribute("aria-expanded"));
const subPages = () =>
  screen.getAllByRole("button").filter((button) => !button.hasAttribute("aria-expanded"));

function renderNav() {
  return render(
    <DashboardProviders>
      <ProductsNav />
    </DashboardProviders>,
  );
}

test("lists every product with Payments expanded by default", () => {
  renderNav();
  expect(productTriggers().map((button) => button.textContent)).toEqual(
    products.map((product) => product.label),
  );
  expect(screen.getByRole("button", { name: "Payments" })).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByText("Analytics")).toBeVisible();
  expect(screen.getByLabelText("Preview")).toBeInTheDocument();
});

test("opening a product collapses the one that was open", async () => {
  const user = userEvent.setup();
  renderNav();

  await user.click(screen.getByRole("button", { name: "Billing" }));

  expect(screen.getByRole("button", { name: "Billing" })).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("button", { name: "Payments" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  expect(screen.getByText("Subscriptions")).toBeVisible();
  expect(screen.queryByText("Analytics")).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Billing" }));
  expect(screen.queryByText("Subscriptions")).not.toBeInTheDocument();
});

test("sub-pages are disabled and explain why on focus", async () => {
  const user = userEvent.setup();
  renderNav();
  await user.click(screen.getByRole("button", { name: "More" }));

  expect(subPages().map((item) => item.textContent)).toContain("Connect");
  for (const item of subPages()) {
    expect(item).toHaveAttribute("aria-disabled", "true");
  }
  expect(screen.queryAllByRole("link")).toHaveLength(0);

  const connect = screen.getByRole("button", { name: "Connect" });
  act(() => connect.focus());
  expect(await screen.findByRole("tooltip")).toHaveTextContent(UNAVAILABLE_HINT);

  await user.click(connect);
  expect(window.location.pathname).toBe("/");
});
