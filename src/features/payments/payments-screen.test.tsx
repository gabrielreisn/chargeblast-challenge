import { beforeEach, expect, test, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fixture from "../../../data/payments.fixture.json";
import { DashboardProviders } from "@/components/dashboard/providers";
import { TopbarSearch } from "@/components/dashboard/topbar-search";
import { snapshotSchema } from "./model";
import { PaymentsScreen } from "./payments-screen";
import { CopyId } from "./ui";
vi.mock("next/navigation", () => import("@/test/next-navigation"));
const snapshot = snapshotSchema.parse(fixture);
const now = Date.parse(snapshot.importedAt) / 1000;
beforeEach(() => window.history.replaceState(null, "", "/payments"));
function renderScreen() {
  return render(
    <DashboardProviders>
      <TopbarSearch />
      <PaymentsScreen snapshot={snapshot} now={now} />
    </DashboardProviders>,
  );
}
function bodyRows() {
  return within(screen.getByRole("table")).getAllByRole("row").slice(1);
}
test("paginates 25/50/100 rows, disables boundaries, and resets after search", async () => {
  const user = userEvent.setup();
  renderScreen();
  expect(bodyRows()).toHaveLength(25);
  expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(window.location.search).toContain("page=2");
  await user.selectOptions(screen.getByLabelText("Rows per page"), "50");
  expect(bodyRows()).toHaveLength(50);
  await user.selectOptions(screen.getByLabelText("Rows per page"), "100");
  expect(bodyRows()).toHaveLength(100);
  fireEvent.change(screen.getByRole("textbox", { name: "Search payments" }), {
    target: { value: snapshot.payments[0].id },
  });
  expect(bodyRows()).toHaveLength(1);
  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
});
test("combines status selection and search, shows empty state, and clears it", async () => {
  const user = userEvent.setup();
  renderScreen();
  await user.click(screen.getByRole("button", { name: /^Failed/ }));
  expect(bodyRows().every((row) => within(row).getByText("Failed"))).toBe(true);
  fireEvent.change(screen.getByRole("textbox", { name: "Search payments" }), {
    target: { value: "not-a-real-payment" },
  });
  expect(screen.getByRole("heading", { name: "No payments found" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Clear all filters" }));
  expect(bodyRows()).toHaveLength(25);
});
test("sorts amounts and exposes the direction accessibly", async () => {
  const user = userEvent.setup();
  renderScreen();
  const sort = within(screen.getByRole("table")).getByRole("button", { name: "Amount" });
  await user.click(sort);
  expect(sort.closest("th")).toHaveAttribute("aria-sort", "descending");
  await user.click(sort);
  expect(sort.closest("th")).toHaveAttribute("aria-sort", "ascending");
});
test("copies the complete ID and reports clipboard failure with a toast", async () => {
  const user = userEvent.setup();
  const write = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
  const id = "pi_a_complete_payment_id";
  render(
    <DashboardProviders>
      <CopyId id={id} />
    </DashboardProviders>,
  );
  await user.click(screen.getByRole("button", { name: `Copy payment ID ${id}` }));
  expect(write).toHaveBeenCalledWith(id);
  expect(screen.getByRole("status")).toHaveTextContent("Copied");
  write.mockRejectedValue(new Error("Denied"));
  await user.click(screen.getByRole("button", { name: `Copy payment ID ${id}` }));
  expect(await screen.findByText("Couldn’t copy payment ID")).toBeVisible();
  expect(screen.getByRole("status")).toHaveTextContent("");
});

test("applies multi-select status/method filters through accessible popovers", async () => {
  const user = userEvent.setup();
  renderScreen();
  await user.click(screen.getAllByRole("button", { name: "Status" })[0]);
  await user.click(screen.getByRole("checkbox", { name: "Failed" }));
  await user.click(screen.getByRole("checkbox", { name: "Pending" }));
  expect(window.location.search).toContain("status=failed%2Cpending");
  await user.keyboard("{Escape}");
  await user.click(screen.getByRole("button", { name: "Payment method" }));
  await user.click(screen.getByRole("checkbox", { name: "Wallet" }));
  expect(window.location.search).toContain("method=wallet");
  expect(bodyRows().every((row) => row.textContent?.includes("Pay"))).toBe(true);
});
test("validates amount bounds and applies an inclusive amount range", async () => {
  const user = userEvent.setup();
  renderScreen();
  await user.click(screen.getAllByRole("button", { name: "Amount" })[0]);
  await user.type(screen.getByLabelText("Minimum amount"), "20");
  await user.type(screen.getByLabelText("Maximum amount"), "10");
  await user.click(screen.getByRole("button", { name: "Apply amount" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Minimum");
  await user.clear(screen.getByLabelText("Maximum amount"));
  await user.type(screen.getByLabelText("Maximum amount"), "50");
  await user.click(screen.getByRole("button", { name: "Apply amount" }));
  expect(window.location.search).toContain("min=20");
  expect(window.location.search).toContain("max=50");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
test("date presets and slash shortcut work from the keyboard", async () => {
  const user = userEvent.setup();
  renderScreen();
  await user.keyboard("/");
  expect(screen.getByRole("textbox", { name: "Search payments" })).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Date and time" }));
  await user.click(screen.getByRole("button", { name: "Last 7 days" }));
  expect(window.location.search).toContain("date=7");
});
