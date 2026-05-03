import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { AddressPill, StatusBadge } from "@/components/pills";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTransaction } from "@/lib/data";
import { explorerUrl, formatAge, formatRitual } from "@/lib/utils";

export default async function TxPage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params;
  if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) notFound();
  const tx = await getTransaction(hash);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase text-ritual-green">Transaction</p>
        <h1 className="mt-2 break-all font-mono text-2xl font-black">{tx.hash}</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>Overview</CardTitle></CardHeader>
        <CardContent className="divide-y divide-ritual-line">
          <Info label="Status" value={<StatusBadge status={tx.status} />} />
          <Info label="Block" value={tx.blockNumber.toString()} />
          <Info label="Timestamp" value={`${tx.timestamp.toUTCString()} (${formatAge(tx.timestamp)})`} />
          <Info label="From" value={<AddressPill address={tx.from} />} />
          <Info label="To" value={<AddressPill address={tx.to} />} />
          <Info label="Value" value={formatRitual(tx.value)} />
          <Info label="Gas Price" value={tx.gasPrice ?? "—"} />
          <Info label="Gas Used" value={tx.gasUsed ?? "—"} />
          <Info label="Effective Fee" value={tx.effectiveGasPrice && tx.gasUsed ? `${BigInt(tx.effectiveGasPrice) * BigInt(tx.gasUsed)} wei` : "—"} />
          <Info label="Nonce" value={String(tx.nonce ?? "—")} />
          <Info label="Input Data" value={<code className="block max-h-56 overflow-auto break-all rounded-md bg-ritual-soft p-3 text-xs">{tx.input ?? "0x"}</code>} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Logs / Events</CardTitle>
          <Button asChild variant="outline" size="sm"><a href={explorerUrl(`/tx/${hash}`)} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /> Official explorer</a></Button>
        </CardHeader>
        <CardContent>
          {"logs" in tx && tx.logs?.length ? (
            <div className="space-y-3">{tx.logs.map((log: any, i: number) => <pre key={log.id ?? i} className="overflow-auto rounded-md bg-ritual-soft p-3 text-xs">{JSON.stringify(log, null, 2)}</pre>)}</div>
          ) : (
            <p className="text-sm text-ritual-muted">No logs available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="grid gap-2 py-4 sm:grid-cols-[180px_1fr]"><dt className="text-sm font-bold text-ritual-muted">{label}</dt><dd className="min-w-0 text-sm">{value}</dd></div>;
}
