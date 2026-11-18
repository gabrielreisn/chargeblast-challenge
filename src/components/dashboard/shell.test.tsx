import { expect, test } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardProviders } from "./providers";
import { DashboardShell } from "./shell";

/** jsdom can't load another document; cancel link defaults after React's handlers have run. */
function cancelNavigation(event: MouseEvent) {
  event.preventDefault();
}

function renderShell() {
  return render(
    <DashboardProviders>
      <DashboardShell search={<input aria-label="Search" />}>
        <p>Page content</p>
      </DashboardShell>
    </DashboardProviders>,
  );
}

test("collapses the desktop sidebar to an icon rail and expands it again", async () => {
  const user = userEvent.setup();
  const { container } = renderShell();
  const sidebar = within(container.querySelector("aside")!);
  const collapse = screen.getByRole("button", { name: "Collapse sidebar" });
  expect(collapse).toHaveAttribute("aria-expanded", "true");
  expect(collapse).toHaveAttribute("aria-controls", "dashboard-sidebar");
  expect(sidebar.getByText("Shortcuts")).toBeInTheDocument();

  await user.click(collapse);
  expect(container.firstElementChild).toHaveAttribute("data-sidebar", "collapsed");
  expect(screen.getByRole("button", { name: "Expand sidebar" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  // The rail keeps every destination, labelled for assistive tech, without visible text.
  expect(sidebar.queryByText("Shortcuts")).not.toBeInTheDocument();
  expect(sidebar.getByRole("link", { name: "Transactions" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(sidebar.getByRole("button", { name: "Home" })).toHaveAttribute("aria-disabled", "true");
  expect(sidebar.getByRole("link", { name: /Developers/ })).toHaveAttribute(
    "href",
    "https://docs.stripe.com",
  );

  await user.click(screen.getByRole("button", { name: "Expand sidebar" }));
  expect(container.firstElementChild).toHaveAttribute("data-sidebar", "expanded");
  expect(sidebar.getByText("Shortcuts")).toBeInTheDocument();
});

test("opens a product's pages beside the rail", async () => {
  const user = userEvent.setup();
  renderShell();
  await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
  await user.click(screen.getByRole("button", { name: "Billing" }));
  const menu = screen.getByRole("menu");
  expect(within(menu).getByRole("menuitem", { name: "Subscriptions" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  expect(within(menu).getByText("Not available in this demo")).toBeInTheDocument();
  await user.keyboard("{Escape}");

  await user.click(screen.getByRole("button", { name: "Recent pages" }));
  expect(
    within(screen.getByRole("menu"))
      .getAllByRole("menuitem")
      .map((item) => item.textContent),
  ).toEqual(["Reports", "Sigma", "Radar"]);
});

test("opens the navigation drawer and closes it on navigation", async () => {
  const user = userEvent.setup();
  renderShell();
  await user.click(screen.getByRole("button", { name: "Open navigation" }));
  const drawer = screen.getByRole("dialog", { name: "Navigation" });
  expect(within(drawer).getByRole("link", { name: "Transactions" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  window.addEventListener("click", cancelNavigation);
  await user.click(within(drawer).getByRole("link", { name: "Transactions" }));
  window.removeEventListener("click", cancelNavigation);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Open navigation" }));
  await user.click(screen.getByRole("button", { name: "Close navigation" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
