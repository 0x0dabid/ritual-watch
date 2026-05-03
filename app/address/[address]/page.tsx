import { notFound } from "next/navigation";
import { isAddress } from "viem";
import { EmptyState } from "@/components/empty-state";
import { NftGrid, RitualNamesCard, TokenHoldingsTable } from "@/components/holdings";
import { IndexedWindowNote } from "@/components/indexing-coverage-card";
import { SectionHeader } from "@/components/section-header";
import { TransactionsTable } from "@/components/transactions-table";
import { WalletSummaryCard } from "@/components/wallet-summary-card";
import { Badge } from "@/components/ui/badge";
import { getIndexingCoverage, getNftHoldings, getTokenHoldings, getWalletProfile, getWalletTransactions } from "@/lib/data";
import { hasDatabase } from "@/lib/db/prisma";
import { getNamesForAddress, getPrimaryName } from "@/lib/ritual/ritualNames";

export default async function AddressPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  if (!isAddress(address)) notFound();
  const [profile, transactions, tokens, nfts, names, primaryName, coverage] = await Promise.all([
    getWalletProfile(address),
    getWalletTransactions(address),
    getTokenHoldings(address),
    getNftHoldings(address),
    getNamesForAddress(address),
    getPrimaryName(address),
    getIndexingCoverage()
  ]);
  const displayProfile =
    profile.totalTransactions > 0
      ? profile
      : {
          ...profile,
          totalTransactions: transactions.length,
          firstSeen: transactions.at(-1)?.timestamp ?? null,
          lastActive: transactions[0]?.timestamp ?? null,
          sentCount: transactions.filter((tx) => tx.from.toLowerCase() === address.toLowerCase()).length,
          receivedCount: transactions.filter((tx) => tx.to?.toLowerCase() === address.toLowerCase()).length
        };
  const databaseEnabled = hasDatabase();
  const recentTxWindow = process.env.RITUAL_LIVE_TX_SCAN_BLOCKS ?? "500";
  const recentLogWindow = process.env.RITUAL_LIVE_LOG_SCAN_BLOCKS ?? "5000";
  const txEmptyDescription = databaseEnabled
    ? "No transactions found inside the currently indexed block range. This does not prove the wallet has no full-chain history."
    : `No transactions found in the recent live RPC scan window (${recentTxWindow} blocks). Configure DATABASE_URL and run the indexer for complete wallet history.`;

  return (
    <div className="space-y-8">
      <WalletSummaryCard profile={displayProfile} primaryName={primaryName} />
      <IndexedWindowNote coverage={coverage} />
      {!databaseEnabled ? (
        <Badge className="border-amber-300 bg-amber-50 text-amber-800">
          Live RPC fallback: scanning recent activity only. Run the indexer with Postgres for complete wallet history and holdings.
        </Badge>
      ) : null}

      <section>
        <SectionHeader title="Transactions" />
        {transactions.length ? <TransactionsTable transactions={transactions} /> : <EmptyState title="No transactions found" description={txEmptyDescription} />}
      </section>

      <section>
        <SectionHeader title="Tokens" />
        <TokenHoldingsTable
          tokens={tokens}
          emptyDescription={
            databaseEnabled
              ? "No ERC-20 balances found inside the currently indexed block range."
              : `No ERC-20 transfers found in the recent live log scan window (${recentLogWindow} blocks). Run the indexer for complete token holdings.`
          }
        />
      </section>

      <section>
        <SectionHeader title="NFTs" />
        <NftGrid
          nfts={nfts}
          emptyDescription={
            databaseEnabled
              ? "No NFT balances found inside the currently indexed block range."
              : `No NFT transfers found in the recent live log scan window (${recentLogWindow} blocks). Run the indexer for complete NFT holdings.`
          }
        />
      </section>

      <section>
        <SectionHeader title=".ritual Names" />
        <RitualNamesCard names={names} />
      </section>
    </div>
  );
}
