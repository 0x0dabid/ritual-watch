import { CalendarClock, CheckCircle2, ListChecks, Timer } from "lucide-react";
import { ActivityEmpty } from "@/components/activity-empty";
import { SectionHeader } from "@/components/section-header";
import { StatCard } from "@/components/stat-card";
import { TransactionsTable } from "@/components/transactions-table";
import { getScheduledActivity } from "@/lib/ritual/activity";

export default async function ScheduledPage() {
  const { transactions, stats } = await getScheduledActivity();
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-bold uppercase text-ritual-green">Ritual Activity</p>
        <h1 className="mt-2 text-3xl font-black">Scheduled Transactions</h1>
        <p className="mt-2 max-w-2xl text-ritual-muted">Scheduled jobs and future execution activity visible in recent Ritual blocks.</p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Scheduled Jobs" value={stats.active.toLocaleString()} icon={CalendarClock} />
        <StatCard label="Total in View" value={stats.total.toLocaleString()} icon={ListChecks} />
        <StatCard label="Completed Recently" value={stats.completedRecently.toLocaleString()} icon={CheckCircle2} />
        <StatCard label="Last Updated" value={stats.lastUpdated.toLocaleTimeString()} icon={Timer} />
      </section>
      <section>
        <SectionHeader title="Scheduled Jobs" />
        {transactions.length ? <TransactionsTable transactions={transactions} /> : <ActivityEmpty title="No scheduled transactions found" />}
      </section>
    </div>
  );
}
