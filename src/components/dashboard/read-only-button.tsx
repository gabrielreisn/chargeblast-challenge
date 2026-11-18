"use client";
import type { ReactNode } from "react";
import { Hint } from "@/features/payments/ui";
import { buttonStyles } from "@/components/ui/styles";

export const READ_ONLY_HINT = "This read-only demo doesn’t move money";

type ReadOnlyButtonProps = {
  children: ReactNode;
  primary?: boolean;
  iconOnly?: boolean;
  /** Accessible name, required for icon-only buttons. */
  label?: string;
  hint?: string;
};

/**
 * A reference action this demo intentionally doesn't perform. It stays
 * focusable (aria-disabled rather than disabled) so the explanation is
 * reachable by hover and keyboard.
 */
export function ReadOnlyButton({
  children,
  primary = false,
  iconOnly = false,
  label,
  hint = READ_ONLY_HINT,
}: ReadOnlyButtonProps) {
  return (
    <Hint text={iconOnly && label ? label : hint}>
      <button
        type="button"
        className={buttonStyles({
          variant: primary ? "primary" : "default",
          size: iconOnly ? "icon" : "md",
        })}
        aria-label={label}
        aria-disabled="true"
      >
        {children}
      </button>
    </Hint>
  );
}
