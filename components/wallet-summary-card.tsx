import { ExternalLink } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { WalletProfile } from "@/lib/types";
import { displayAddress, explorerUrl, formatAge, formatRitual, shorten } from "@/lib/utils";

export function WalletSummaryCard({ profile, primaryName }: { profile: WalletProfile; primaryName?: string | null }) {
  const address = displayAddress(profile.address);
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
              {primaryName ? <span className="rounded-full bg-ritual-green/10 px-2.5 py-1 font-semibold text-ritual-green">{primaryName.endsWith(".ritual") ? primaryName : `${primaryName}.ritual`}</span> : null}
              <Button asChild variant="outline" size="sm">
                <a href={explorerUrl(`/address/${address}`)} target="_blank" rel="noreferrer"><ExternalLink className="size-3.5" /> Explorer</a>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-[520px]">
            <Metric label="Balance" value={formatRitual(profile.balance)} />
            <Metric label="Transactions" value={profile.totalTransactions.toLocaleString()} />
            <Metric label="Sent" value={profile.sentCount.toLocaleString()} />
            <Metric label="Received" value={profile.receivedCount.toLocaleString()} />
            <Metric label="First Seen" value={profile.firstSeen ? formatAge(profile.firstSeen) : "—"} />
            <Metric label="Last Active" value={profile.lastActive ? formatAge(profile.lastActive) : "—"} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ritual-line bg-ritual-soft/55 p-3">
      <p className="text-xs font-bold uppercase text-ritual-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-black">{value}</p>
    </div>
  );
}
