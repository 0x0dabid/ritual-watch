import { Activity, Blocks, Clock3, Gauge, Users, Wallet } from "lucide-react";
import { ActivityChart } from "@/components/charts";
import { BlocksTable } from "@/components/blocks-table";
import { GlobalSearch } from "@/components/global-search";
import { IndexingCoverageCard } from "@/components/indexing-coverage-card";
import { SectionHeader } from "@/components/section-header";
import { StatCard } from "@/components/stat-card";
import { TransactionsTable } from "@/components/transactions-table";
import { getDashboard } from "@/lib/data";
import { formatAge, formatNumber } from "@/lib/utils";

export const revalidate = 60;

export default async function HomePage() {
  const { stats, latestTransactions, latestBlocks, daily, coverage } = await getDashboard();
  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase text-ritual-green">Ritual Testnet Explorer</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-normal lg:text-6xl">Ritual Watch</h1>
          <p className="mt-4 max-w-2xl text-lg text-ritual-muted">
            Wallets, transactions, blocks, tokens, NFTs, and .ritual identities - all in one place.
          </p>
        </div>
        <div className="rounded-lg border border-ritual-line bg-ritual-surface p-4 shadow-card">
          <GlobalSearch />
        </div>
      </section>

      <IndexingCoverageCard coverage={coverage} />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Indexed Transactions" value={formatNumber(stats.totalTransactions)} icon={Activity} sub="Within indexed coverage" />
        <StatCard label="Indexed Tx Today" value={formatNumber(stats.dailyTransactions)} icon={Gauge} sub="UTC day in indexed data" />
        <StatCard label="Indexed Active Wallets" value={formatNumber(stats.totalActiveWallets)} icon={Wallet} sub="Unique senders/receivers indexed" />
        <StatCard label="Indexed Active Today" value={formatNumber(stats.activeWalletsToday)} icon={Users} sub="UTC day in indexed data" />
        <StatCard label="Latest Block" value={formatNumber(stats.latestBlock)} icon={Blocks} sub={stats.latestBlockTimestamp ? formatAge(stats.latestBlockTimestamp) : undefined} />
        <StatCard label="Indexed Avg Block Time" value={stats.averageBlockTime} icon={Clock3} sub="Based on recent indexed blocks" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ActivityChart title="Indexed Daily Transactions" data={daily} dataKey="txCount" />
        <ActivityChart title="Indexed Daily Active Wallets" data={daily} dataKey="activeWallets" />
      </section>

      <section>
        <SectionHeader title="Latest Indexed Transactions" href="/transactions" />
        <TransactionsTable transactions={latestTransactions} />
      </section>

      <section>
        <SectionHeader title="Latest Indexed Blocks" href="/blocks" />
        <BlocksTable blocks={latestBlocks} />
      </section>
    </div>
  );
}
