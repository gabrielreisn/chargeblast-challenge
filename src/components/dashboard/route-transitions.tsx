"use client";
import { ViewTransition, type ReactNode } from "react";
import { useSelectedLayoutSegment } from "next/navigation";

// Route navigations are React transitions, so these animate automatically on
// navigation. Animation classes are defined in the "View transitions" section of
// globals.css. `default="none"` keeps unrelated updates (filters, sorting) still.

type TransitionProps = { children: ReactNode };

/** Fades a section in and out when navigating between sections, e.g. Transactions ↔ payment details. */
export function PageTransition({ children }: TransitionProps) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      {children}
    </ViewTransition>
  );
}

/**
 * Crossfades tab content when the selected Transactions tab changes. Keying by
 * segment turns a tab switch into an exit/enter pair instead of an in-place update.
 */
export function TabContentTransition({ children }: TransitionProps) {
  const segment = useSelectedLayoutSegment();
  return (
    <ViewTransition key={segment} enter="tab-enter" exit="tab-exit" default="none">
      {children}
    </ViewTransition>
  );
}

/**
 * Underline for the active tab. Only the active tab renders it, so a tab switch
 * unmounts one and mounts another with the same name, and the browser morphs it
 * across. `share` must stay explicit alongside `default="none"`.
 */
export function ActiveTabIndicator() {
  return (
    <ViewTransition name="transactions-tab-indicator" share="tab-indicator" default="none">
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-ink-strong" />
    </ViewTransition>
  );
}
