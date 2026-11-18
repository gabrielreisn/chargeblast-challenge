"use client";
import { useEffect } from "react";
import Link from "next/link";
import { RotateCw, TriangleAlert } from "lucide-react";
import { buttonStyles } from "@/components/ui/styles";
import { EmptyState } from "./empty-state";

/** Props Next.js passes to `error.tsx` and `global-error.tsx`. */
export type ErrorBoundaryProps = { error: unknown; retry: () => void };

type ErrorStateProps = ErrorBoundaryProps & {
  title?: string;
  description?: string;
  headingLevel?: "h1" | "h2";
  homeHref?: string | null;
};

function errorDigest(error: unknown) {
  return error instanceof Error && "digest" in error && typeof error.digest === "string"
    ? error.digest
    : null;
}

/** Fallback UI shared by the `error.tsx` route boundaries. */
export function ErrorState({
  error,
  retry,
  title = "Something went wrong",
  description = "This page couldn’t be loaded. Try again, and if the problem continues, contact support with the reference below.",
  headingLevel,
  homeHref = "/payments",
}: ErrorStateProps) {
  useEffect(
    function reportError() {
      // Replace with an error reporting service once one is configured.
      console.error(error);
    },
    [error],
  );
  const digest = errorDigest(error);
  const devMessage =
    process.env.NODE_ENV === "development" && error instanceof Error ? error.message : null;
  const details = digest || devMessage;
  return (
    <div role="alert">
      <EmptyState
        tone="critical"
        headingLevel={headingLevel}
        icon={<TriangleAlert size={18} />}
        title={title}
        description={description}
        footer={
          details && (
            <dl className="mt-4 grid gap-0.5 border-t border-line pt-3 text-11 text-muted">
              {digest && (
                <>
                  <dt>Reference</dt>
                  <dd>
                    <code className="font-mono break-all text-ink-soft">{digest}</code>
                  </dd>
                </>
              )}
              {devMessage && (
                <>
                  <dt className="mt-1.5">Details (development only)</dt>
                  <dd>
                    <code className="font-mono break-all text-ink-soft">{devMessage}</code>
                  </dd>
                </>
              )}
            </dl>
          )
        }
      >
        <button
          type="button"
          className={buttonStyles({ variant: "primary" })}
          onClick={() => retry()}
        >
          <RotateCw size={12} aria-hidden="true" />
          Try again
        </button>
        {homeHref && (
          <Link className={buttonStyles()} href={homeHref}>
            Go to payments
          </Link>
        )}
      </EmptyState>
    </div>
  );
}
