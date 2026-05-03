import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { AddressPill, StatusBadge, TxHashPill } from "@/components/pills";
import { Button } from "@/components/ui/button";
import { RitualTxTypeBadge } from "@/components/ritual-tx-type-badge";
import type { ExplorerTransaction } from "@/lib/types";
import { explorerUrl, formatAge, formatRitual } from "@/lib/utils";

export function TransactionsTable({ transactions }: { transactions: ExplorerTransaction[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-ritual-line bg-ritual-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-ritual-line bg-ritual-soft/70 text-xs uppercase text-ritual-muted">
            <tr>
              <th className="px-4 py-3">Tx Hash</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">From</th>
              <th className="px-4 py-3">To</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Block</th>
              <th className="px-4 py-3">Age</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ritual-line">
            {transactions.map((tx) => (
              <tr key={tx.hash} className="hover:bg-ritual-soft/40">
                <td className="px-4 py-3"><TxHashPill hash={tx.hash} /></td>
                <td className="px-4 py-3"><StatusBadge status={tx.status} /></td>
                <td className="px-4 py-3"><RitualTxTypeBadge tx={tx} /></td>
                <td className="px-4 py-3 font-mono text-xs">{tx.method ?? "Transfer"}</td>
                <td className="px-4 py-3"><AddressPill address={tx.from} /></td>
                <td className="px-4 py-3"><AddressPill address={tx.to} /></td>
                <td className="px-4 py-3">{formatRitual(tx.value)}</td>
                <td className="px-4 py-3"><Link className="text-ritual-green hover:underline" href={`/block/${tx.blockNumber}`}>{tx.blockNumber.toString()}</Link></td>
                <td className="px-4 py-3 text-ritual-muted">{formatAge(tx.timestamp)}</td>
                <td className="px-4 py-3">
                  <Button asChild variant="ghost" size="icon">
                    <a href={explorerUrl(`/tx/${tx.hash}`)} target="_blank" rel="noreferrer" aria-label="Open in Ritual Explorer"><ExternalLink className="size-4" /></a>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
