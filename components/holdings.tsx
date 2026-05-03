import { ExternalLink } from "lucide-react";
import { AddressPill } from "@/components/pills";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { explorerUrl, formatNumber } from "@/lib/utils";

export function TokenHoldingsTable({
  tokens,
  emptyDescription
}: {
  tokens: Array<{ contract: string; symbol: string; name: string; balance: bigint; formattedBalance?: string }>;
  emptyDescription?: string;
}) {
  if (!tokens.length) return <EmptyState title="No tokens found" description={emptyDescription} />;
  return (
    <div className="overflow-hidden rounded-lg border border-ritual-line bg-ritual-surface">
      <table className="w-full text-left text-sm">
        <thead className="bg-ritual-soft text-xs uppercase text-ritual-muted">
          <tr><th className="px-4 py-3">Token</th><th className="px-4 py-3">Contract</th><th className="px-4 py-3">Balance</th><th className="px-4 py-3"></th></tr>
        </thead>
        <tbody className="divide-y divide-ritual-line">
          {tokens.map((token) => (
            <tr key={token.contract}>
              <td className="px-4 py-3"><span className="font-bold">{token.symbol}</span><span className="block text-xs text-ritual-muted">{token.name}</span></td>
              <td className="px-4 py-3"><AddressPill address={token.contract} /></td>
              <td className="px-4 py-3">{token.formattedBalance ?? formatNumber(token.balance)}</td>
              <td className="px-4 py-3"><Button asChild variant="ghost" size="icon"><a href={explorerUrl(`/address/${token.contract}`)} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /></a></Button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function NftGrid({ nfts, emptyDescription }: { nfts: Array<{ contract: string; tokenId: string; standard: string }>; emptyDescription?: string }) {
  if (!nfts.length) return <EmptyState title="No NFTs found" description={emptyDescription} />;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {nfts.map((nft) => (
        <Card key={`${nft.contract}-${nft.tokenId}`}>
          <CardHeader>
            <CardTitle className="text-sm">{nft.standard} #{nft.tokenId}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex aspect-square items-center justify-center rounded-md bg-ritual-soft text-sm font-bold text-ritual-muted">NFT</div>
            <AddressPill address={nft.contract} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function RitualNamesCard({ names }: { names: Array<{ name: string; tokenId?: string | null; owner: string }> }) {
  if (!names.length) return <EmptyState title="No .ritual names found" />;
  return (
    <div className="grid gap-3">
      {names.map((name) => (
        <Card key={name.name}>
          <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-black text-ritual-green">{name.name}</p>
              <p className="text-sm text-ritual-muted">Token ID: {name.tokenId ?? "—"}</p>
            </div>
            <div className="flex items-center gap-2">
              <AddressPill address={name.owner} />
              <Button asChild variant="ghost" size="icon"><a href={explorerUrl(`/token/${name.tokenId ?? name.name}`)} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /></a></Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
