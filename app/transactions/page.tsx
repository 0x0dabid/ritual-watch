import { EmptyState } from "@/components/empty-state";
import { SectionHeader } from "@/components/section-header";
import { TransactionsTable } from "@/components/transactions-table";
import { getLatestTransactions } from "@/lib/data";

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const transactions = await getLatestTransactions(30, page);
  return (
    <div>
      <SectionHeader title="Latest Transactions" />
      {transactions.length ? <TransactionsTable transactions={transactions} /> : <EmptyState title="No transactions indexed yet" description="Run the indexer to populate historical transaction data." />}
    </div>
  );
}
