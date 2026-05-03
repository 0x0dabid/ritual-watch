import { Bot, BrainCircuit, RadioTower, Timer } from "lucide-react";
import { ActivityEmpty } from "@/components/activity-empty";
import { SectionHeader } from "@/components/section-header";
import { StatCard } from "@/components/stat-card";
import { TransactionsTable } from "@/components/transactions-table";
import { getAgentActivity } from "@/lib/ritual/activity";

export const revalidate = 60;

export default async function AgentsPage() {
  const { transactions, stats } = await getAgentActivity();
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-bold uppercase text-ritual-green">Ritual Activity</p>
        <h1 className="mt-2 text-3xl font-black">Agents</h1>
        <p className="mt-2 max-w-2xl text-ritual-muted">Recent sovereign and persistent agent activity detected from Ritual-native transaction metadata.</p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Agent Txs" value={stats.total.toLocaleString()} icon={Bot} />
        <StatCard label="Persistent" value={stats.persistent.toLocaleString()} icon={BrainCircuit} />
        <StatCard label="Sovereign" value={stats.sovereign.toLocaleString()} icon={RadioTower} />
        <StatCard label="Last Updated" value={stats.lastUpdated.toLocaleTimeString()} icon={Timer} />
      </section>
      <section>
        <SectionHeader title="Agent Transactions" />
        {transactions.length ? <TransactionsTable transactions={transactions} /> : <ActivityEmpty title="No agent transactions found" />}
      </section>
    </div>
  );
}
