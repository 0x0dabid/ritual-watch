import { EmptyState } from "@/components/empty-state";
import { IndexedWindowNote } from "@/components/indexing-coverage-card";
import { SectionHeader } from "@/components/section-header";
import { TransactionsTable } from "@/components/transactions-table";
import { getIndexingCoverage, getLatestTransactions } from "@/lib/data";

export const revalidate = 30;

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const [transactions, coverage] = await Promise.all([getLatestTransactions(30, page), getIndexingCoverage()]);
  return (
    <div className="space-y-4">
      <SectionHeader title="Latest Indexed Transactions" />
      <IndexedWindowNote coverage={coverage} />
      {transactions.length ? <TransactionsTable transactions={transactions} /> : <EmptyState title="No transactions indexed yet" description="Run the indexer to populate the selected coverage window." />}
    </div>
  );
}
