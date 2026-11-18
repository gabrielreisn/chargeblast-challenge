import { afterEach, expect, test, vi } from "vitest";
import { toast } from "sonner";
import { ApiError, requestJson, toastRequestError } from "./api-client";

vi.mock("sonner", () => ({ toast: { error: vi.fn<typeof toast.error>() } }));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.mocked(toast.error).mockReset();
});

function stubFetch(response: Response | Error) {
  const fetch = vi.fn<typeof globalThis.fetch>(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  );
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

test("returns parsed JSON for successful responses", async () => {
  const fetch = stubFetch(Response.json({ data: [1, 2] }));
  await expect(requestJson<{ data: number[] }>("/api/payouts")).resolves.toEqual({ data: [1, 2] });
  expect(fetch).toHaveBeenCalledWith(
    "/api/payouts",
    expect.objectContaining({ headers: { Accept: "application/json" } }),
  );
});

test("uses the message, code and request ID from a Stripe-style error envelope", async () => {
  stubFetch(
    Response.json(
      {
        error: {
          type: "invalid_request_error",
          code: "balance_insufficient",
          message: "Insufficient funds.",
        },
      },
      { status: 400, headers: { "request-id": "req_123" } },
    ),
  );
  const error = await requestJson("/api/payouts").catch((reason: unknown) => reason);
  expect(error).toBeInstanceOf(ApiError);
  expect(error).toMatchObject({
    message: "Insufficient funds.",
    status: 400,
    code: "balance_insufficient",
    requestId: "req_123",
  });
});

test("falls back to a status description for non-JSON errors", async () => {
  stubFetch(new Response("<html>Bad gateway</html>", { status: 502 }));
  await expect(requestJson("/api/payouts")).rejects.toMatchObject({
    message: "Something went wrong on our end. Try again.",
    status: 502,
  });
});

test("reports network failures as an ApiError with status 0", async () => {
  stubFetch(new TypeError("Failed to fetch"));
  await expect(requestJson("/api/payouts")).rejects.toMatchObject({
    status: 0,
    code: "network_error",
  });
});

test("toasts request errors with details, request ID and an optional retry", () => {
  const retry = vi.fn<() => void>();
  toastRequestError(
    "Payout failed",
    new ApiError("Insufficient funds.", { status: 400, requestId: "req_123" }),
    { retry },
  );
  expect(toast.error).toHaveBeenCalledWith("Payout failed", {
    description: "Insufficient funds. Request ID: req_123",
    action: { label: "Try again", onClick: retry },
  });
});

test("hides internal messages from unknown errors and ignores aborted requests", () => {
  toastRequestError("Export failed", new Error("TypeError: x is undefined"));
  expect(toast.error).toHaveBeenCalledWith("Export failed", {
    description: "Something went wrong. Try again.",
    action: undefined,
  });
  vi.mocked(toast.error).mockClear();
  toastRequestError("Export failed", new DOMException("Aborted", "AbortError"));
  expect(toast.error).not.toHaveBeenCalled();
});
