import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { render } from "@testing-library/react";
import { testRouter } from "@/test/next-navigation";
import { TimeZoneSync } from "./time-zone-sync";

vi.mock("next/navigation", () => import("@/test/next-navigation"));
const { refresh } = testRouter;
const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

function clearCookie() {
  document.cookie = "tz=; path=/; max-age=0";
}
beforeEach(clearCookie);
afterEach(() => {
  clearCookie();
  refresh.mockClear();
});

test("does nothing when the page was rendered in the browser's time zone", () => {
  render(<TimeZoneSync renderedTimeZone={browserTimeZone} />);
  expect(refresh).not.toHaveBeenCalled();
  expect(document.cookie).not.toContain("tz=");
});

test("stores the browser's time zone and re-renders once when the server guessed another", () => {
  render(<TimeZoneSync renderedTimeZone="Pacific/Kiritimati" />);
  expect(document.cookie).toContain(`tz=${encodeURIComponent(browserTimeZone)}`);
  expect(refresh).toHaveBeenCalledOnce();
});

test("doesn't refresh in a loop when the server ignored the stored zone", () => {
  document.cookie = `tz=${encodeURIComponent(browserTimeZone)}; path=/`;
  render(<TimeZoneSync renderedTimeZone="Pacific/Kiritimati" />);
  expect(refresh).not.toHaveBeenCalled();
});
