"use client";
import type { ReactNode } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Toaster } from "@/components/feedback/toaster";

type DashboardProvidersProps = { children: ReactNode };

export function DashboardProviders({ children }: DashboardProvidersProps) {
  return (
    <Tooltip.Provider delayDuration={250}>
      {children}
      <Toaster />
    </Tooltip.Provider>
  );
}
