import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExplorerBlock } from "@/lib/types";
import { explorerUrl, formatAge, formatNumber } from "@/lib/utils";

export function BlocksTable({ blocks }: { blocks: ExplorerBlock[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-ritual-line bg-ritual-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-ritual-line bg-ritual-soft/70 text-xs uppercase text-ritual-muted">
            <tr>
              <th className="px-4 py-3">Block</th>
              <th className="px-4 py-3">Age</th>
              <th className="px-4 py-3">Tx Count</th>
              <th className="px-4 py-3">Gas Used</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">Hash</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ritual-line">
            {blocks.map((block) => (
              <tr key={block.hash} className="hover:bg-ritual-soft/40">
                <td className="px-4 py-3"><Link className="font-semibold text-ritual-green hover:underline" href={`/block/${block.number}`}>{block.number.toString()}</Link></td>
                <td className="px-4 py-3 text-ritual-muted">{formatAge(block.timestamp)}</td>
                <td className="px-4 py-3">{formatNumber(block.txCount)}</td>
                <td className="px-4 py-3">{formatNumber(BigInt(block.gasUsed))}</td>
                <td className="px-4 py-3">{block.size ? formatNumber(block.size) : "—"}</td>
                <td className="px-4 py-3 font-mono text-xs text-ritual-muted">{block.hash.slice(0, 18)}...</td>
                <td className="px-4 py-3">
                  <Button asChild variant="ghost" size="icon">
                    <a href={explorerUrl(`/block/${block.number}`)} target="_blank" rel="noreferrer" aria-label="Open in Ritual Explorer"><ExternalLink className="size-4" /></a>
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
