import { PageTransition, TabContentTransition } from "@/components/dashboard/route-transitions";
import { TransactionsHeader } from "@/components/dashboard/transactions-header";

// From md up each wrapper passes the remaining height down, so the payments table can fill it.
const fillHeight = "md:flex md:min-h-0 md:flex-1 md:flex-col";

export default function TransactionsLayout({ children }: LayoutProps<"/">) {
  return (
    <PageTransition>
      <div className={fillHeight}>
        <TransactionsHeader />
        <TabContentTransition>
          <div className={fillHeight}>{children}</div>
        </TabContentTransition>
      </div>
    </PageTransition>
  );
}
