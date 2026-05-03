import { Activity, GitCommitHorizontal, RotateCw, Timer } from "lucide-react";
import { ActivityEmpty } from "@/components/activity-empty";
import { SectionHeader } from "@/components/section-header";
import { StatCard } from "@/components/stat-card";
import { TransactionsTable } from "@/components/transactions-table";
import { getAsyncActivity } from "@/lib/ritual/activity";

export const revalidate = 60;

export default async function AsyncPage() {
  const { transactions, stats } = await getAsyncActivity();
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-bold uppercase text-ritual-green">Ritual Activity</p>
        <h1 className="mt-2 text-3xl font-black">Async Transactions</h1>
        <p className="mt-2 max-w-2xl text-ritual-muted">Asynchronous execution transactions, including commitments and settlements.</p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Async" value={stats.total.toLocaleString()} icon={Activity} />
        <StatCard label="Commit" value={stats.commitCount.toLocaleString()} icon={GitCommitHorizontal} />
        <StatCard label="Settle" value={stats.settleCount.toLocaleString()} icon={RotateCw} />
        <StatCard label="Last Updated" value={stats.lastUpdated.toLocaleTimeString()} icon={Timer} />
      </section>
      <section>
        <SectionHeader title="Async Activity" />
        {transactions.length ? <TransactionsTable transactions={transactions} /> : <ActivityEmpty title="No async transactions found" />}
      </section>
    </div>
  );
}
