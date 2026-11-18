// Test double for `next/navigation` that re-renders on history changes, like
// the App Router does when client code calls history.pushState/replaceState.
import { useSyncExternalStore } from "react";
import { vi } from "vitest";

const LOCATION_CHANGE = "test:locationchange";

for (const method of ["pushState", "replaceState"] as const) {
  const original = window.history[method].bind(window.history);
  window.history[method] = (...args: Parameters<History["pushState"]>) => {
    original(...args);
    window.dispatchEvent(new Event(LOCATION_CHANGE));
  };
}

function subscribe(callback: () => void) {
  window.addEventListener(LOCATION_CHANGE, callback);
  window.addEventListener("popstate", callback);
  return () => {
    window.removeEventListener(LOCATION_CHANGE, callback);
    window.removeEventListener("popstate", callback);
  };
}

export function useSearchParams() {
  const search = useSyncExternalStore(subscribe, () => window.location.search);
  return new URLSearchParams(search);
}

export function usePathname() {
  return useSyncExternalStore(subscribe, () => window.location.pathname);
}

export function useSelectedLayoutSegment() {
  return usePathname().split("/")[1] || null;
}

// One stable instance, like the App Router's, so effects that depend on it don't re-run.
export const testRouter = {
  push: (href: string) => window.history.pushState(null, "", href),
  replace: (href: string) => window.history.replaceState(null, "", href),
  /** Spy: tests assert that server components were asked to re-render. */
  refresh: vi.fn<() => void>(),
};

export function useRouter() {
  return testRouter;
}
