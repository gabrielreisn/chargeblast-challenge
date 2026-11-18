import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorState } from "./error-state";

test("announces the failure, shows the server digest and retries", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const retry = vi.fn<() => void>();
  const error = Object.assign(new Error("An error occurred in the Server Components render."), {
    digest: "3214567890",
  });
  render(<ErrorState error={error} retry={retry} headingLevel="h1" />);
  expect(screen.getByRole("alert")).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 1, name: "Something went wrong" })).toBeVisible();
  expect(screen.getByText("3214567890")).toBeVisible();
  expect(screen.getByRole("link", { name: "Go to payments" })).toHaveAttribute("href", "/payments");
  await userEvent.setup().click(screen.getByRole("button", { name: "Try again" }));
  expect(retry).toHaveBeenCalledOnce();
  expect(console.error).toHaveBeenCalledWith(error);
});

test("handles non-Error thrown values without a digest", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  render(<ErrorState error="boom" retry={() => {}} homeHref={null} />);
  expect(screen.queryByText("Reference")).not.toBeInTheDocument();
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});
