"use client";
import { createContext, use, type ReactNode } from "react";
import { formattersFor, type FormatSettings, type Formatters } from "./format";

const FormattersContext = createContext<Formatters | null>(null);

type FormattersProviderProps = { settings: FormatSettings; children: ReactNode };

/** Shares the viewer's formatters with the filter controls deeper in the payments screen. */
export function FormattersProvider({ settings, children }: FormattersProviderProps) {
  return <FormattersContext value={formattersFor(settings)}>{children}</FormattersContext>;
}

export function useFormatters() {
  const formatters = use(FormattersContext);
  if (!formatters) throw new Error("useFormatters() must be used inside <FormattersProvider>.");
  return formatters;
}
