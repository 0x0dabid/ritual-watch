import "./loadEnv";
import { createPublicClient, http, parseAbi, type Block, type Log, type Transaction } from "viem";
import { prisma } from "@/lib/db/prisma";
import { ritualChain, ritualConfig } from "@/lib/config";
import { requireEnv } from "./loadEnv";
import { ERC1155_TRANSFER_BATCH_TOPIC, ERC1155_TRANSFER_SINGLE_TOPIC, TRANSFER_TOPIC, topicToAddress, topicToUint } from "@/lib/indexer/events";

requireEnv("DATABASE_URL");
const client = createPublicClient({ chain: ritualChain, transport: http(ritualConfig.rpcUrl) });
const ZERO = "0x0000000000000000000000000000000000000000";
const BATCH_SIZE = 10n;
const DEFAULT_START_BLOCK = 1_000_000n;

const erc20Abi = parseAbi([
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)"
]);

async function main() {
  const configuredStartBlock = BigInt(process.env.INDEXER_START_BLOCK || "0");
  const startBlock = configuredStartBlock === 0n ? DEFAULT_START_BLOCK : configuredStartBlock;
  if (configuredStartBlock === 0n) {
    console.log(`INDEXER_START_BLOCK=0 detected; starting at ${DEFAULT_START_BLOCK.toString()} to avoid malformed genesis-era timestamps.`);
  }
  await prisma.indexedState.upsert({
    where: { id: "ritual-testnet" },
    update: {},
    create: { id: "ritual-testnet", lastBlock: startBlock > 0n ? startBlock - 1n : 0n }
  });

  console.log("Ritual Watch indexer started");
  for (;;) {
    const state = await prisma.indexedState.findUniqueOrThrow({ where: { id: "ritual-testnet" } });
    const latest = await client.getBlockNumber();
    let next = state.lastBlock + 1n;
    if (next < startBlock) next = startBlock;

    if (next > latest) {
      await sleep(4_000);
      continue;
    }

    const end = latest - next + 1n > BATCH_SIZE ? next + BATCH_SIZE - 1n : latest;
    for (let n = next; n <= end; n++) {
      await indexBlock(n);
      await prisma.indexedState.update({ where: { id: "ritual-testnet" }, data: { lastBlock: n } });
      console.log(`indexed block ${n.toString()}`);
    }
  }
}

async function indexBlock(blockNumber: bigint) {
  const block = await client.getBlock({ blockNumber, includeTransactions: true });
  const timestamp = blockTimestamp(block);
  if (!timestamp) {
    console.warn(`Skipping block ${blockNumber.toString()} with unsupported timestamp ${block.timestamp.toString()}`);
    return;
  }
  const txs = block.transactions as Transaction[];
  const receipts = await Promise.all(txs.map((tx) => client.getTransactionReceipt({ hash: tx.hash }).catch(() => null)));

  await prisma.$transaction(async (db) => {
    await db.block.upsert({
      where: { number: block.number! },
      update: blockData(block, timestamp),
      create: blockData(block, timestamp)
    });

    for (let i = 0; i < txs.length; i++) {
      const tx = txs[i];
      const receipt = receipts[i];
      await db.transaction.upsert({
        where: { hash: tx.hash.toLowerCase() },
        update: txData(tx, block, receipt, timestamp),
        create: txData(tx, block, receipt, timestamp)
      });

      await db.addressActivity.upsert({
        where: { address_txHash_direction: { address: tx.from.toLowerCase(), txHash: tx.hash.toLowerCase(), direction: "sent" } },
        update: {},
        create: { id: `${tx.hash.toLowerCase()}-sent-${tx.from.toLowerCase()}`, address: tx.from.toLowerCase(), txHash: tx.hash.toLowerCase(), blockNumber: block.number!, timestamp, direction: "sent" }
      });
      if (tx.to) {
        await db.addressActivity.upsert({
          where: { address_txHash_direction: { address: tx.to.toLowerCase(), txHash: tx.hash.toLowerCase(), direction: "received" } },
          update: {},
          create: { id: `${tx.hash.toLowerCase()}-received-${tx.to.toLowerCase()}`, address: tx.to.toLowerCase(), txHash: tx.hash.toLowerCase(), blockNumber: block.number!, timestamp, direction: "received" }
        });
      }

      for (const log of receipt?.logs ?? []) {
        const id = `${tx.hash.toLowerCase()}-${log.logIndex}`;
        await db.log.upsert({
          where: { id },
          update: {},
          create: {
            id,
            txHash: tx.hash.toLowerCase(),
            blockNumber: block.number!,
            address: log.address.toLowerCase(),
            topic0: log.topics[0],
            topic1: log.topics[1],
            topic2: log.topics[2],
            topic3: log.topics[3],
            data: log.data,
            logIndex: log.logIndex
          }
        });
      }
    }
  }, { maxWait: 20_000, timeout: 60_000 });

  for (let i = 0; i < txs.length; i++) {
    await indexTransfers(txs[i], receipts[i]?.logs ?? [], timestamp, block.number!);
  }
  await recomputeDaily(timestamp);
}

async function indexTransfers(tx: Transaction, logs: Log[], timestamp: Date, blockNumber: bigint) {
  for (const log of logs) {
    const topic0 = log.topics[0];
    if (topic0 === TRANSFER_TOPIC && log.topics.length >= 4) {
      const from = topicToAddress(log.topics[1]);
      const to = topicToAddress(log.topics[2]);
      const tokenIdOrValue = topicToUint(log.topics[3]);
      if (!from || !to || !tokenIdOrValue) continue;
      await prisma.nftTransfer.upsert({
        where: { id: `${tx.hash.toLowerCase()}-${log.logIndex}-nft` },
        update: {},
        create: { id: `${tx.hash.toLowerCase()}-${log.logIndex}-nft`, txHash: tx.hash.toLowerCase(), blockNumber, timestamp, contract: log.address.toLowerCase(), from, to, tokenId: tokenIdOrValue, standard: "ERC-721" }
      });
    } else if (topic0 === TRANSFER_TOPIC && log.topics.length === 3) {
      const from = topicToAddress(log.topics[1]);
      const to = topicToAddress(log.topics[2]);
      if (!from || !to) continue;
      await prisma.tokenTransfer.upsert({
        where: { id: `${tx.hash.toLowerCase()}-${log.logIndex}-erc20` },
        update: {},
        create: { id: `${tx.hash.toLowerCase()}-${log.logIndex}-erc20`, txHash: tx.hash.toLowerCase(), blockNumber, timestamp, token: log.address.toLowerCase(), from, to, value: BigInt(log.data).toString() }
      });
      await upsertTokenMetadata(log.address.toLowerCase() as `0x${string}`);
    } else if (topic0 === ERC1155_TRANSFER_SINGLE_TOPIC || topic0 === ERC1155_TRANSFER_BATCH_TOPIC) {
      await prisma.nftContract.upsert({ where: { address: log.address.toLowerCase() }, update: {}, create: { address: log.address.toLowerCase(), name: null, symbol: null } });
    }
  }
}

async function upsertTokenMetadata(address: `0x${string}`) {
  const existing = await prisma.tokenContract.findUnique({ where: { address: address.toLowerCase() } });
  if (existing) return;
  const [symbol, name, decimals] = await Promise.all([
    client.readContract({ address, abi: erc20Abi, functionName: "symbol" }).catch(() => null),
    client.readContract({ address, abi: erc20Abi, functionName: "name" }).catch(() => null),
    client.readContract({ address, abi: erc20Abi, functionName: "decimals" }).catch(() => null)
  ]);
  await prisma.tokenContract.upsert({
    where: { address: address.toLowerCase() },
    update: {},
    create: { address: address.toLowerCase(), symbol: symbol ? String(symbol) : null, name: name ? String(name) : null, decimals: decimals === null ? null : Number(decimals) }
  });
}

async function recomputeDaily(date: Date) {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const nextDay = new Date(day.getTime() + 86_400_000);
  const [txCount, activeWallets] = await Promise.all([
    prisma.transaction.count({ where: { timestamp: { gte: day, lt: nextDay } } }),
    prisma.addressActivity.groupBy({ by: ["address"], where: { timestamp: { gte: day, lt: nextDay } } }).then((rows) => rows.length)
  ]);
  await prisma.dailyStat.upsert({ where: { day }, update: { txCount, activeWallets }, create: { day, txCount, activeWallets } });
}

function blockData(block: Block, timestamp: Date) {
  return {
    number: block.number!,
    hash: block.hash!.toLowerCase(),
    parentHash: block.parentHash.toLowerCase(),
    timestamp,
    txCount: block.transactions.length,
    gasUsed: block.gasUsed.toString(),
    gasLimit: block.gasLimit.toString(),
    baseFee: block.baseFeePerGas?.toString(),
    miner: block.miner?.toLowerCase(),
    size: undefined
  };
}

function blockTimestamp(block: Block) {
  const raw = Number(block.timestamp);
  if (!Number.isSafeInteger(raw)) return null;
  const millis = raw > 9_999_999_999 ? raw : raw * 1000;
  const date = new Date(millis);
  const year = date.getUTCFullYear();
  if (year < 2020 || year > 2100) return null;
  return date;
}

function txData(tx: Transaction, block: Block, receipt: Awaited<ReturnType<typeof client.getTransactionReceipt>> | null, timestamp: Date) {
  return {
    hash: tx.hash.toLowerCase(),
    blockNumber: block.number!,
    blockHash: block.hash!.toLowerCase(),
    transactionIndex: tx.transactionIndex ?? 0,
    from: tx.from.toLowerCase(),
    to: tx.to?.toLowerCase(),
    value: tx.value.toString(),
    gas: tx.gas.toString(),
    gasPrice: tx.gasPrice?.toString(),
    maxFeePerGas: tx.maxFeePerGas?.toString(),
    nonce: tx.nonce ?? 0,
    input: tx.input,
    status: receipt?.status,
    gasUsed: receipt?.gasUsed.toString(),
    effectiveGasPrice: receipt?.effectiveGasPrice.toString(),
    timestamp,
    method: tx.input && tx.input !== "0x" ? tx.input.slice(0, 10) : "Transfer"
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
