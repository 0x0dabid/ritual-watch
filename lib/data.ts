import { unstable_noStore as noStore } from "next/cache";
import { getAddress, isAddress } from "viem";
import { prisma, hasDatabase } from "@/lib/db/prisma";
import { publicClient } from "@/lib/ritual/client";
import { scanNftHoldings, scanRecentWalletTransactions, scanTokenHoldings } from "@/lib/ritual/liveRpc";
import type { DailyPoint, ExplorerBlock, ExplorerTransaction, IndexingCoverage, WalletProfile } from "@/lib/types";
import { normalizeAddress } from "@/lib/utils";

export async function getDashboard() {
  noStore();
  const [stats, latestTransactions, latestBlocks, daily, coverage] = await Promise.all([
    getNetworkStats(),
    getLatestTransactions(8),
    getLatestBlocks(8),
    getDailyStats(),
    getIndexingCoverage()
  ]);
  return { stats, latestTransactions, latestBlocks, daily, coverage };
}

export async function getIndexingCoverage(): Promise<IndexingCoverage> {
  noStore();
  const latestBlock = await publicClient.getBlockNumber();

  if (hasDatabase()) {
    try {
      const coverageStartBlock = getCoverageStartBlock();
      const [state, firstBlock, indexedBlocks] = await Promise.all([
        prisma.indexedState.findUnique({ where: { id: "ritual-testnet" } }),
        prisma.block.findFirst({ where: { number: { gte: coverageStartBlock } }, orderBy: { number: "asc" }, select: { number: true } }),
        prisma.block.count({ where: { number: { gte: coverageStartBlock } } })
      ]);
      const lastIndexedBlock = state?.lastBlock ?? null;
      const remainingBlocks = lastIndexedBlock && latestBlock > lastIndexedBlock ? latestBlock - lastIndexedBlock : 0n;
      const isCaughtUp = remainingBlocks <= 10n;
      const displayStartBlock = firstBlock?.number ?? coverageStartBlock;

      return {
        mode: "indexed",
        startBlock: displayStartBlock,
        lastIndexedBlock,
        latestBlock,
        indexedBlocks,
        isCaughtUp,
        remainingBlocks,
        label: isCaughtUp ? "Indexed data is near live" : "Indexed data is still catching up",
        detail: lastIndexedBlock && lastIndexedBlock >= displayStartBlock
          ? `Stats, wallet history, tokens, and NFTs reflect indexed blocks ${displayStartBlock.toString()}-${lastIndexedBlock.toString()}, not full chain history yet.`
          : "The database is connected, but indexed coverage is not populated yet."
      };
    } catch (error) {
      console.warn("Indexing coverage unavailable, falling back to live RPC mode.", error);
    }
  }

  return {
    mode: "live-rpc",
    startBlock: null,
    lastIndexedBlock: null,
    latestBlock,
    indexedBlocks: 0,
    isCaughtUp: false,
    remainingBlocks: 0n,
    label: "Live RPC preview",
    detail: "Postgres indexing is not available. The explorer is showing live network data and bounded recent scans only."
  };
}

export async function getNetworkStats() {
  noStore();
  const latestBlockNumber = await publicClient.getBlockNumber();

  if (hasDatabase()) {
    try {
      const today = startOfUtcDay(new Date());
      const coverageStartBlock = getCoverageStartBlock();
      const [totalTransactions, dailyTransactions, activeWallets, activeToday, recentBlocks] = await Promise.all([
        prisma.transaction.count({ where: { blockNumber: { gte: coverageStartBlock } } }),
        prisma.transaction.count({ where: { blockNumber: { gte: coverageStartBlock }, timestamp: { gte: today } } }),
        prisma.addressActivity.groupBy({ by: ["address"], where: { blockNumber: { gte: coverageStartBlock } } }).then((rows) => rows.length),
        prisma.addressActivity.groupBy({ by: ["address"], where: { blockNumber: { gte: coverageStartBlock }, timestamp: { gte: today } } }).then((rows) => rows.length),
        prisma.block.findMany({ where: { number: { gte: coverageStartBlock } }, orderBy: { number: "desc" }, take: 20 })
      ]);

      const avg = averageBlockTime(recentBlocks.map((b) => b.timestamp));
      return {
        totalTransactions,
        dailyTransactions,
        totalActiveWallets: activeWallets,
        activeWalletsToday: activeToday,
        latestBlock: Number(latestBlockNumber),
        averageBlockTime: avg ? `${avg.toFixed(1)}s` : "-",
        latestBlockTimestamp: recentBlocks[0]?.timestamp
      };
    } catch (error) {
      console.warn("Database analytics unavailable, falling back to live RPC.", error);
    }
  }

  const latestBlock = await publicClient.getBlock({ blockNumber: latestBlockNumber });
  return {
    totalTransactions: 0,
    dailyTransactions: 0,
    totalActiveWallets: 0,
    activeWalletsToday: 0,
    latestBlock: Number(latestBlockNumber),
    averageBlockTime: "-",
    latestBlockTimestamp: new Date(Number(latestBlock.timestamp) * 1000)
  };
}

export async function getLatestBlocks(limit = 20, page = 1): Promise<ExplorerBlock[]> {
  noStore();
  if (hasDatabase()) {
    try {
      return await prisma.block.findMany({ where: { number: { gte: getCoverageStartBlock() } }, orderBy: { number: "desc" }, take: limit, skip: (page - 1) * limit });
    } catch (error) {
      console.warn("Database blocks unavailable, falling back to live RPC.", error);
    }
  }

  const latest = await publicClient.getBlockNumber();
  const count = Math.min(limit, Number(latest) + 1);
  const blocks = await Promise.all(
    Array.from({ length: count }, (_, i) => publicClient.getBlock({ blockNumber: latest - BigInt(i) }))
  );
  return blocks.map((block) => ({
    number: block.number!,
    hash: block.hash!,
    parentHash: block.parentHash,
    timestamp: new Date(Number(block.timestamp) * 1000),
    txCount: block.transactions.length,
    gasUsed: block.gasUsed.toString(),
    gasLimit: block.gasLimit.toString(),
    baseFee: block.baseFeePerGas?.toString(),
    miner: block.miner,
    size: undefined
  }));
}

export async function getLatestTransactions(limit = 20, page = 1): Promise<ExplorerTransaction[]> {
  noStore();
  if (hasDatabase()) {
    try {
      return await prisma.transaction.findMany({
        where: { blockNumber: { gte: getCoverageStartBlock() } },
        orderBy: [{ blockNumber: "desc" }, { transactionIndex: "desc" }],
        take: limit,
        skip: (page - 1) * limit
      });
    } catch (error) {
      console.warn("Database transactions unavailable, falling back to live RPC.", error);
    }
  }

  const latest = await publicClient.getBlock({ blockTag: "latest", includeTransactions: true });
  return latest.transactions.slice(0, limit).map((tx) => ({
    hash: tx.hash,
    blockNumber: tx.blockNumber ?? latest.number!,
    from: tx.from,
    to: tx.to,
    value: tx.value.toString(),
    gas: tx.gas.toString(),
    gasPrice: tx.gasPrice?.toString(),
    nonce: tx.nonce,
    input: tx.input,
    type: tx.type,
    status: "pending",
    timestamp: new Date(Number(latest.timestamp) * 1000),
    method: tx.input && tx.input !== "0x" ? tx.input.slice(0, 10) : "Transfer"
  }));
}

export async function getDailyStats(): Promise<DailyPoint[]> {
  noStore();
  if (hasDatabase()) {
    try {
      const coverageStartBlock = getCoverageStartBlock();
      const firstCoveredBlock = await prisma.block.findFirst({ where: { number: { gte: coverageStartBlock } }, orderBy: { number: "asc" }, select: { timestamp: true } });
      const stats = await prisma.dailyStat.findMany({ where: firstCoveredBlock ? { day: { gte: startOfUtcDay(firstCoveredBlock.timestamp) } } : undefined, orderBy: { day: "asc" }, take: 30 });
      if (stats.length) {
        return stats.map((stat) => ({
          day: stat.day.toISOString().slice(5, 10),
          txCount: stat.txCount,
          activeWallets: stat.activeWallets
        }));
      }
    } catch (error) {
      console.warn("Database daily stats unavailable, falling back to seed data.", error);
    }
  }
  return seedDaily();
}

export async function getWalletProfile(address: string): Promise<WalletProfile> {
  noStore();
  const checksummed = isAddress(address) ? getAddress(address) : address;
  const normalized = normalizeAddress(checksummed)!;
  const balance = isAddress(checksummed) ? await publicClient.getBalance({ address: checksummed as `0x${string}` }) : 0n;

  let activity: Awaited<ReturnType<typeof prisma.addressActivity.findMany>> = [];
  if (hasDatabase()) {
    try {
      activity = await prisma.addressActivity.findMany({ where: { address: normalized, blockNumber: { gte: getCoverageStartBlock() } }, orderBy: { timestamp: "asc" } });
    } catch (error) {
      console.warn("Database wallet activity unavailable.", error);
    }
  }

  return {
    address: checksummed,
    balance,
    totalTransactions: activity.length,
    firstSeen: activity[0]?.timestamp ?? null,
    lastActive: activity.at(-1)?.timestamp ?? null,
    sentCount: activity.filter((a) => a.direction === "sent").length,
    receivedCount: activity.filter((a) => a.direction === "received").length
  };
}

export async function getWalletTransactions(address: string, limit = 50) {
  noStore();
  if (hasDatabase()) {
    try {
      const normalized = normalizeAddress(address)!;
      const transactions = await prisma.transaction.findMany({
        where: { blockNumber: { gte: getCoverageStartBlock() }, OR: [{ from: normalized }, { to: normalized }] },
        orderBy: [{ blockNumber: "desc" }, { transactionIndex: "desc" }],
        take: limit
      });
      if (transactions.length) return transactions;
    } catch (error) {
      console.warn("Database wallet transactions unavailable, falling back to live RPC.", error);
    }
  }
  return scanRecentWalletTransactions(address, limit);
}

export async function getTokenHoldings(address: string) {
  noStore();
  if (hasDatabase()) {
    try {
      const normalized = normalizeAddress(address)!;
      const transfers = await prisma.tokenTransfer.findMany({
        where: { blockNumber: { gte: getCoverageStartBlock() }, OR: [{ from: normalized }, { to: normalized }] }
      });
      const balances = new Map<string, bigint>();
      for (const t of transfers) {
        const value = BigInt(t.value);
        balances.set(t.token, (balances.get(t.token) ?? 0n) + (t.to === normalized ? value : -value));
      }
      const contracts = await prisma.tokenContract.findMany({ where: { address: { in: [...balances.keys()] } } });
      const holdings = [...balances.entries()].filter(([, balance]) => balance > 0n).map(([token, balance]) => ({
        contract: token,
        balance,
        formattedBalance: balance.toString(),
        symbol: contracts.find((c) => c.address === token)?.symbol ?? "TOKEN",
        name: contracts.find((c) => c.address === token)?.name ?? "Unknown token"
      }));
      if (holdings.length) return holdings;
    } catch (error) {
      console.warn("Database token holdings unavailable, falling back to live RPC.", error);
    }
  }
  return scanTokenHoldings(address);
}

export async function getNftHoldings(address: string) {
  noStore();
  if (hasDatabase()) {
    try {
      const normalized = normalizeAddress(address)!;
      const transfers = await prisma.nftTransfer.findMany({
        where: { blockNumber: { gte: getCoverageStartBlock() }, OR: [{ from: normalized }, { to: normalized }] },
        orderBy: { timestamp: "asc" }
      });
      const owned = new Map<string, { contract: string; tokenId: string; standard: string }>();
      for (const t of transfers) {
        const key = `${t.contract}:${t.tokenId}`;
        if (t.to === normalized) owned.set(key, { contract: t.contract, tokenId: t.tokenId, standard: t.standard });
        if (t.from === normalized) owned.delete(key);
      }
      const holdings = [...owned.values()];
      if (holdings.length) return holdings;
    } catch (error) {
      console.warn("Database NFT holdings unavailable, falling back to live RPC.", error);
    }
  }
  return scanNftHoldings(address);
}

export async function getTransaction(hash: string) {
  noStore();
  if (hasDatabase()) {
    try {
      const tx = await prisma.transaction.findUnique({ where: { hash: hash.toLowerCase() }, include: { logs: true } });
      if (tx) return tx;
    } catch (error) {
      console.warn("Database transaction lookup unavailable, falling back to live RPC.", error);
    }
  }

  const [tx, receipt] = await Promise.all([
    publicClient.getTransaction({ hash: hash as `0x${string}` }),
    publicClient.getTransactionReceipt({ hash: hash as `0x${string}` }).catch(() => null)
  ]);
  const block = tx.blockNumber ? await publicClient.getBlock({ blockNumber: tx.blockNumber }) : null;
  return {
    hash: tx.hash,
    blockNumber: tx.blockNumber ?? 0n,
    blockHash: tx.blockHash ?? "",
    transactionIndex: tx.transactionIndex ?? 0,
    from: tx.from,
    to: tx.to,
    value: tx.value.toString(),
    gas: tx.gas.toString(),
    gasPrice: tx.gasPrice?.toString(),
    maxFeePerGas: tx.maxFeePerGas?.toString(),
    nonce: tx.nonce,
    input: tx.input,
    type: tx.type,
    status: receipt?.status,
    gasUsed: receipt?.gasUsed?.toString(),
    effectiveGasPrice: receipt?.effectiveGasPrice?.toString(),
    timestamp: block ? new Date(Number(block.timestamp) * 1000) : new Date(),
    method: tx.input && tx.input !== "0x" ? tx.input.slice(0, 10) : "Transfer",
    logs: receipt?.logs.map((log, index) => ({ id: `${hash}-${index}`, address: log.address, data: log.data, topics: log.topics, logIndex: log.logIndex })) ?? []
  };
}

export async function getBlock(number: string | number | bigint) {
  noStore();
  const blockNumber = BigInt(number);
  if (hasDatabase()) {
    try {
      const block = await prisma.block.findUnique({
        where: { number: blockNumber },
        include: { transactions: { orderBy: { transactionIndex: "asc" } } }
      });
      if (block) return block;
    } catch (error) {
      console.warn("Database block lookup unavailable, falling back to live RPC.", error);
    }
  }

  const block = await publicClient.getBlock({ blockNumber, includeTransactions: true });
  return {
    number: block.number!,
    hash: block.hash!,
    parentHash: block.parentHash,
    timestamp: new Date(Number(block.timestamp) * 1000),
    txCount: block.transactions.length,
    gasUsed: block.gasUsed.toString(),
    gasLimit: block.gasLimit.toString(),
    baseFee: block.baseFeePerGas?.toString(),
    miner: block.miner,
    transactions: block.transactions.map((tx) => ({
      hash: tx.hash,
      blockNumber: block.number!,
      from: tx.from,
      to: tx.to,
      value: tx.value.toString(),
      timestamp: new Date(Number(block.timestamp) * 1000),
      type: tx.type,
      status: "indexed"
    }))
  };
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function getCoverageStartBlock() {
  const configured = BigInt(process.env.INDEXER_COVERAGE_START_BLOCK || process.env.INDEXER_START_BLOCK || "1000000");
  return configured > 0n ? configured : 1_000_000n;
}

function averageBlockTime(dates: Date[]) {
  if (dates.length < 2) return null;
  const sorted = dates.map((d) => d.getTime()).sort((a, b) => b - a);
  const deltas = sorted.slice(0, -1).map((time, i) => Math.abs(time - sorted[i + 1]) / 1000);
  return deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length;
}

function seedDaily(): DailyPoint[] {
  return Array.from({ length: 14 }, (_, i) => {
    const day = new Date(Date.now() - (13 - i) * 86_400_000);
    return { day: day.toISOString().slice(5, 10), txCount: 0, activeWallets: 0 };
  });
}
