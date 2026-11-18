import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard/shell";
import { DashboardProviders } from "@/components/dashboard/providers";
import { TopbarSearch, TopbarSearchFallback } from "@/components/dashboard/topbar-search";

export default function DashboardLayout({ children }: LayoutProps<"/">) {
  return (
    <DashboardProviders>
      <DashboardShell
        search={
          <Suspense fallback={<TopbarSearchFallback />}>
            <TopbarSearch />
          </Suspense>
        }
      >
        {children}
      </DashboardShell>
    </DashboardProviders>
  );
}
