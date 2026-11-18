import { toast } from "sonner";

type ApiErrorOptions = { status: number; code?: string | null; requestId?: string | null };

/**
 * Error raised for a failed HTTP request. The message is safe to show to the
 * user: it comes from a Stripe-style error envelope (`{ error: { message } }`)
 * when the server returns one, and from a generic status description otherwise.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly requestId: string | null;

  constructor(message: string, { status, code = null, requestId = null }: ApiErrorOptions) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

const statusMessages: Record<number, string> = {
  400: "The request was invalid.",
  401: "Your session has expired. Sign in again.",
  403: "You don’t have permission to do that.",
  404: "We couldn’t find what you were looking for.",
  409: "This changed while you were working. Refresh and try again.",
  429: "Too many requests. Wait a moment and try again.",
};

function messageForStatus(status: number) {
  return (
    statusMessages[status] ??
    (status >= 500 ? "Something went wrong on our end. Try again." : "The request failed.")
  );
}

async function readErrorEnvelope(response: Response) {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "error" in body) {
      const error = (body as { error: unknown }).error;
      if (error && typeof error === "object") {
        const { message, code } = error as { message?: unknown; code?: unknown };
        return {
          message: typeof message === "string" && message ? message : null,
          code: typeof code === "string" ? code : null,
        };
      }
    }
  } catch {
    // Non-JSON error bodies fall back to the status description.
  }
  return { message: null, code: null };
}

/** Fetch JSON and throw an {@link ApiError} for network failures and non-2xx responses. */
export async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, {
      ...init,
      headers: { Accept: "application/json", ...init?.headers },
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
    throw new ApiError("Couldn’t reach the server. Check your connection and try again.", {
      status: 0,
      code: "network_error",
    });
  }
  if (!response.ok) {
    const { message, code } = await readErrorEnvelope(response);
    throw new ApiError(message ?? messageForStatus(response.status), {
      status: response.status,
      code,
      requestId: response.headers.get("request-id"),
    });
  }
  return (await response.json()) as T;
}

/** User-facing description of any thrown value. */
export function describeError(error: unknown, fallback = "Something went wrong. Try again.") {
  if (error instanceof ApiError) return error.message;
  return fallback;
}

type ToastRequestErrorOptions = { retry?: () => void };

/**
 * Report a failed request with a toast. Use for recoverable failures triggered
 * by a user action (saving, exporting, copying); rendering failures belong to
 * the route's `error.tsx` boundary instead.
 */
export function toastRequestError(
  title: string,
  error: unknown,
  options: ToastRequestErrorOptions = {},
) {
  if (error instanceof DOMException && error.name === "AbortError") return;
  const requestId = error instanceof ApiError ? error.requestId : null;
  toast.error(title, {
    description: requestId
      ? `${describeError(error)} Request ID: ${requestId}`
      : describeError(error),
    action: options.retry ? { label: "Try again", onClick: options.retry } : undefined,
  });
}
