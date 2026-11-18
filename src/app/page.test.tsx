import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import Home from "@/app/page";

test("renders the starter page and documentation link", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { level: 1, name: "Chargeblast Challenge" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Next.js documentation" })).toHaveAttribute(
    "href",
    "https://nextjs.org/docs",
  );
});
