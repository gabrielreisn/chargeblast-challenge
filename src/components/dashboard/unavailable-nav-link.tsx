"use client";
import type { ReactNode } from "react";
import { Hint } from "@/components/ui/hint";

export const UNAVAILABLE_HINT = "Not available in this demo";

type UnavailableNavLinkProps = {
  children: ReactNode;
  className: string;
  /** Accessible name for icon-only items (the collapsed sidebar); it also leads the tooltip. */
  label?: string;
};

/**
 * A sidebar destination this demo doesn't implement. Like `ReadOnlyButton`, it stays focusable
 * (aria-disabled rather than disabled) so the explanation is reachable by hover and keyboard.
 */
export function UnavailableNavLink({ children, className, label }: UnavailableNavLinkProps) {
  return (
    <Hint text={label ? `${label} · ${UNAVAILABLE_HINT}` : UNAVAILABLE_HINT} side="right">
      <button type="button" aria-disabled="true" aria-label={label} className={className}>
        {children}
      </button>
    </Hint>
  );
}
