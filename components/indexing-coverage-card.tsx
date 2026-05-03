import { Database, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { IndexingCoverage } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

export function IndexingCoverageCard({ coverage }: { coverage: IndexingCoverage }) {
  const range =
    coverage.startBlock && coverage.lastIndexedBlock
      ? `${formatNumber(Number(coverage.startBlock))} - ${formatNumber(Number(coverage.lastIndexedBlock))}`
      : "Not indexed yet";

  return (
    <Card className="border-ritual-green/25 bg-ritual-green/5">
      <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-3">
          <div className="mt-0.5 h-fit rounded-md border border-ritual-green/20 bg-ritual-green/10 p-2 text-ritual-green">
            <Database className="size-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold">{coverage.label}</p>
              <Badge className="border-ritual-green/25 bg-white/70 text-ritual-green">
                {coverage.mode === "indexed" ? "Indexed window" : "RPC fallback"}
              </Badge>
            </div>
            <p className="mt-1 max-w-3xl text-sm text-ritual-muted">{coverage.detail}</p>
          </div>
        </div>
        <div className="grid min-w-fit grid-cols-2 gap-3 text-sm sm:grid-cols-4 lg:text-right">
          <Metric label="Indexed Range" value={range} />
          <Metric label="Indexed Blocks" value={formatNumber(coverage.indexedBlocks)} />
          <Metric label="Latest Block" value={formatNumber(Number(coverage.latestBlock))} />
          <Metric label="Remaining" value={coverage.mode === "indexed" ? formatNumber(Number(coverage.remainingBlocks)) : "-"} />
        </div>
      </CardContent>
    </Card>
  );
}

export function IndexedWindowNote({ coverage }: { coverage: IndexingCoverage }) {
  return (
    <div className="rounded-lg border border-ritual-line bg-ritual-surface px-4 py-3 text-sm text-ritual-muted">
      <span className="font-semibold text-black">Data coverage:</span>{" "}
      {coverage.mode === "indexed"
        ? coverage.detail
        : "Live RPC fallback is active, so historical wallet/token/NFT data is limited."}{" "}
      <a
        className="inline-flex items-center gap-1 font-semibold text-ritual-green hover:underline"
        href="https://github.com/0x0dabid/ritual-watch/actions/workflows/indexer.yml"
        target="_blank"
        rel="noreferrer"
      >
        Indexer <ExternalLink className="size-3" />
      </a>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase text-ritual-muted">{label}</p>
      <p className="mt-1 font-mono font-semibold text-black">{value}</p>
    </div>
  );
}
