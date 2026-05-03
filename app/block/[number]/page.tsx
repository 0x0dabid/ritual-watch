import { notFound } from "next/navigation";
import { BlocksTable } from "@/components/blocks-table";
import { TransactionsTable } from "@/components/transactions-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBlock } from "@/lib/data";
import { formatAge, formatNumber } from "@/lib/utils";

export const revalidate = 300;

export default async function BlockPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  if (!/^\d+$/.test(number)) notFound();
  const block = await getBlock(number);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase text-ritual-green">Block</p>
        <h1 className="mt-2 text-3xl font-black">#{block.number.toString()}</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>Block Details</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Metric label="Timestamp" value={`${block.timestamp.toUTCString()} (${formatAge(block.timestamp)})`} />
          <Metric label="Transactions" value={formatNumber(block.txCount)} />
          <Metric label="Gas Used" value={formatNumber(BigInt(block.gasUsed))} />
          <Metric label="Gas Limit" value={formatNumber(BigInt(block.gasLimit))} />
          <Metric label="Base Fee" value={block.baseFee ?? "—"} />
          <Metric label="Miner / Proposer" value={block.miner ?? "—"} />
          <Metric label="Parent Hash" value={block.parentHash} />
          <Metric label="Block Hash" value={block.hash} />
        </CardContent>
      </Card>
      <section>
        <h2 className="mb-4 text-xl font-black">Transactions in Block</h2>
        {block.transactions?.length ? <TransactionsTable transactions={block.transactions} /> : <BlocksTable blocks={[block]} />}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-ritual-line bg-ritual-soft/50 p-3"><p className="text-xs font-bold uppercase text-ritual-muted">{label}</p><p className="mt-1 break-all text-sm font-semibold">{value}</p></div>;
}
