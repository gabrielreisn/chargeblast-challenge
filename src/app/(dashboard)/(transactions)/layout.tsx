import { TransactionsHeader } from "@/components/dashboard/transactions-header";

export default function TransactionsLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <TransactionsHeader />
      {children}
    </>
  );
}
