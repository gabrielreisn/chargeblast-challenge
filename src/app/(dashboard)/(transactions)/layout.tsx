import { PageTransition, TabContentTransition } from "@/components/dashboard/route-transitions";
import { TransactionsHeader } from "@/components/dashboard/transactions-header";

export default function TransactionsLayout({ children }: LayoutProps<"/">) {
  return (
    <PageTransition>
      <div>
        <TransactionsHeader />
        <TabContentTransition>
          <div>{children}</div>
        </TabContentTransition>
      </div>
    </PageTransition>
  );
}
