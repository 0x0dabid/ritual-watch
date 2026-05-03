import { Activity, Blocks, Clock3, Gauge, Users, Wallet } from "lucide-react";
import { ActivityChart } from "@/components/charts";
import { BlocksTable } from "@/components/blocks-table";
import { GlobalSearch } from "@/components/global-search";
import { SectionHeader } from "@/components/section-header";
import { StatCard } from "@/components/stat-card";
import { TransactionsTable } from "@/components/transactions-table";
import { getDashboard } from "@/lib/data";
import { formatAge, formatNumber } from "@/lib/utils";

export default async function HomePage() {
  const { stats, latestTransactions, latestBlocks, daily } = await getDashboard();
  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase text-ritual-green">Ritual Testnet Explorer</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-normal lg:text-6xl">Ritual Watch</h1>
          <p className="mt-4 max-w-2xl text-lg text-ritual-muted">
            Wallets, transactions, blocks, tokens, NFTs, and .ritual identities — all in one place.
          </p>
        </div>
        <div className="rounded-lg border border-ritual-line bg-ritual-surface p-4 shadow-card">
          <GlobalSearch />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Transactions" value={formatNumber(stats.totalTransactions)} icon={Activity} />
        <StatCard label="Daily Transactions" value={formatNumber(stats.dailyTransactions)} icon={Gauge} />
        <StatCard label="Total Active Wallets" value={formatNumber(stats.totalActiveWallets)} icon={Wallet} />
        <StatCard label="Active Wallets Today" value={formatNumber(stats.activeWalletsToday)} icon={Users} />
        <StatCard label="Latest Block" value={formatNumber(stats.latestBlock)} icon={Blocks} sub={stats.latestBlockTimestamp ? formatAge(stats.latestBlockTimestamp) : undefined} />
        <StatCard label="Average Block Time" value={stats.averageBlockTime} icon={Clock3} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ActivityChart title="Daily Transactions" data={daily} dataKey="txCount" />
        <ActivityChart title="Daily Active Wallets" data={daily} dataKey="activeWallets" />
      </section>

      <section>
        <SectionHeader title="Latest Transactions" href="/transactions" />
        <TransactionsTable transactions={latestTransactions} />
      </section>

      <section>
        <SectionHeader title="Latest Blocks" href="/blocks" />
        <BlocksTable blocks={latestBlocks} />
      </section>
    </div>
  );
}
