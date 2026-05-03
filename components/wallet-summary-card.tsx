import { ExternalLink } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { IndexingCoverage, WalletProfile } from "@/lib/types";
import { displayAddress, explorerUrl, formatAge, formatRitual, shorten } from "@/lib/utils";

export function WalletSummaryCard({
  profile,
  primaryName,
  coverage
}: {
  profile: WalletProfile;
  primaryName?: string | null;
  coverage?: IndexingCoverage;
}) {
  const address = displayAddress(profile.address);
  const formattedName = primaryName ? (primaryName.endsWith(".ritual") ? primaryName : `${primaryName}.ritual`) : null;
  const activitySub =
    coverage?.mode === "indexed" && coverage.startBlock && coverage.lastIndexedBlock
      ? `Blocks ${coverage.startBlock.toString()}-${coverage.lastIndexedBlock.toString()}`
      : coverage?.mode === "live-rpc"
        ? "Recent RPC scan"
        : "Indexed window";

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase text-ritual-muted">Wallet Profile</p>
            <h1 className="mt-2 break-all font-mono text-xl font-black lg:text-2xl">{address}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ritual-muted">
              <span className="font-mono">{shorten(address)}</span>
              <CopyButton value={address} />
              {formattedName ? <span className="rounded-full bg-ritual-green/10 px-2.5 py-1 font-semibold text-ritual-green">{formattedName}</span> : null}
              <Button asChild variant="outline" size="sm">
                <a href={explorerUrl(`/address/${address}`)} target="_blank" rel="noreferrer"><ExternalLink className="size-3.5" /> Explorer</a>
              </Button>
            </div>
            <p className="mt-3 max-w-xl text-sm text-ritual-muted">
              Balance and .ritual identity are live. Activity counters are limited to indexed coverage.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-[560px]">
            <Metric label="Live Balance" value={formatRitual(profile.balance)} tone="live" />
            <Metric label="Primary Name" value={formattedName ?? "None"} tone={formattedName ? "live" : "muted"} />
            <Metric label="Indexed Txs" value={profile.totalTransactions.toLocaleString()} sub={activitySub} />
            <Metric label="Indexed Sent" value={profile.sentCount.toLocaleString()} sub={activitySub} />
            <Metric label="Indexed Received" value={profile.receivedCount.toLocaleString()} sub={activitySub} />
            <Metric
              label="Indexed Active"
              value={profile.lastActive ? formatAge(profile.lastActive) : "No indexed activity"}
              sub={profile.firstSeen ? `First seen ${formatAge(profile.firstSeen)}` : activitySub}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  sub,
  tone
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "live" | "muted";
}) {
  return (
    <div className="rounded-md border border-ritual-line bg-ritual-soft/55 p-3">
      <p className="text-xs font-bold uppercase text-ritual-muted">{label}</p>
      <p className={tone === "live" ? "mt-1 truncate text-sm font-black text-ritual-green" : tone === "muted" ? "mt-1 truncate text-sm font-black text-ritual-muted" : "mt-1 truncate text-sm font-black"}>
        {value}
      </p>
      {sub ? <p className="mt-1 truncate text-[11px] font-medium text-ritual-muted">{sub}</p> : null}
    </div>
  );
}
