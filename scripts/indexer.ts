import "./loadEnv";
import { createPublicClient, http, parseAbi, type Block, type Log, type Transaction } from "viem";
import { prisma } from "@/lib/db/prisma";
import { ritualChain, ritualConfig } from "@/lib/config";
import { requireEnv } from "./loadEnv";
import { ERC1155_TRANSFER_BATCH_TOPIC, ERC1155_TRANSFER_SINGLE_TOPIC, TRANSFER_TOPIC, topicToAddress, topicToUint } from "@/lib/indexer/events";

requireEnv("DATABASE_URL");

const client = createPublicClient({ chain: ritualChain, transport: http(ritualConfig.rpcUrl) });
const BATCH_SIZE = BigInt(process.env.INDEXER_BATCH_SIZE || "25");
const DEFAULT_START_BLOCK = 1_000_000n;
const INDEX_LOGS = process.env.INDEXER_STORE_RAW_LOGS === "true";
const INDEX_TOKEN_METADATA = process.env.INDEXER_TOKEN_METADATA === "true";

const erc20Abi = parseAbi([
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)"
]);

async function main() {
  const configuredStartBlock = BigInt(process.env.INDEXER_START_BLOCK || "0");
  const startBlock = configuredStartBlock === 0n ? DEFAULT_START_BLOCK : configuredStartBlock;
  const once = process.env.INDEXER_ONCE === "true";
  const maxBlocks = BigInt(process.env.INDEXER_MAX_BLOCKS || (once ? "100" : "0"));
  let indexedBlocks = 0n;

  if (configuredStartBlock === 0n) {
    console.log(`INDEXER_START_BLOCK=0 detected; starting at ${DEFAULT_START_BLOCK.toString()} to avoid malformed genesis-era timestamps.`);
  }

  await prisma.indexedState.upsert({
    where: { id: "ritual-testnet" },
    update: {},
    create: { id: "ritual-testnet", lastBlock: startBlock > 0n ? startBlock - 1n : 0n }
  });

  console.log("Ritual Watch focused indexer started");
  for (;;) {
    if (maxBlocks > 0n && indexedBlocks >= maxBlocks) {
      console.log(`Indexed ${indexedBlocks.toString()} block(s); exiting bounded indexer run.`);
      return;
    }

    const state = await prisma.indexedState.findUniqueOrThrow({ where: { id: "ritual-testnet" } });
    const latest = await client.getBlockNumber();
    let next = state.lastBlock + 1n;
    if (next < startBlock) next = startBlock;

    if (next > latest) {
      if (once) {
        console.log(`Indexer is caught up at block ${state.lastBlock.toString()}; latest is ${latest.toString()}.`);
        return;
      }
      await sleep(4_000);
      continue;
    }

    const remaining = maxBlocks > 0n ? maxBlocks - indexedBlocks : BATCH_SIZE;
    const batchSize = remaining < BATCH_SIZE ? remaining : BATCH_SIZE;
    const end = latest - next + 1n > batchSize ? next + batchSize - 1n : latest;

    for (let n = next; n <= end; n++) {
      await indexFocusedBlock(n);
      await prisma.indexedState.update({ where: { id: "ritual-testnet" }, data: { lastBlock: n } });
      indexedBlocks++;
      console.log(`indexed focused block ${n.toString()}`);
    }
  }
}

async function indexFocusedBlock(blockNumber: bigint) {
  const block = await client.getBlock({ blockNumber, includeTransactions: true });
  const timestamp = blockTimestamp(block);
  if (!timestamp) {
    console.warn(`Skipping block ${blockNumber.toString()} with unsupported timestamp ${block.timestamp.toString()}`);
    return;
  }

  const txs = block.transactions as Transaction[];
  const receipts = await Promise.all(txs.map((tx) => client.getTransactionReceipt({ hash: tx.hash }).catch(() => null)));
  const blockDataValue = blockData(block, timestamp);
  const txRows = txs.map((tx, i) => txData(tx, block, receipts[i], timestamp));
  const activityRows = buildAddressActivityRows(txs, block.number!, timestamp);
  const transferRows = buildTransferRows(txs, receipts.map((receipt) => receipt?.logs ?? []), timestamp, block.number!);
  const rawLogRows = INDEX_LOGS ? buildRawLogRows(txs, receipts.map((receipt) => receipt?.logs ?? []), block.number!) : [];

  await prisma.$transaction(async (db) => {
    await db.block.upsert({
      where: { number: block.number! },
      update: blockDataValue,
      create: blockDataValue
    });

    for (const row of txRows) {
      await db.transaction.upsert({
        where: { hash: row.hash },
        update: row,
        create: row
      });
    }

    if (activityRows.length) {
      await db.addressActivity.createMany({ data: activityRows, skipDuplicates: true });
    }
    if (transferRows.token.length) {
      await db.tokenTransfer.createMany({ data: transferRows.token, skipDuplicates: true });
    }
    if (transferRows.nft.length) {
      await db.nftTransfer.createMany({ data: transferRows.nft, skipDuplicates: true });
    }
    if (rawLogRows.length) {
      await db.log.createMany({ data: rawLogRows, skipDuplicates: true });
    }
  }, { maxWait: 20_000, timeout: 60_000 });

  if (INDEX_TOKEN_METADATA) {
    const tokenAddresses = [...new Set(transferRows.token.map((row) => row.token))];
    await Promise.all(tokenAddresses.map((address) => upsertTokenMetadata(address as `0x${string}`)));
  }

  await recomputeDaily(timestamp);
}

function buildAddressActivityRows(txs: Transaction[], blockNumber: bigint, timestamp: Date) {
  const rows = [];
  for (const tx of txs) {
    rows.push({
      id: `${tx.hash.toLowerCase()}-sent-${tx.from.toLowerCase()}`,
      address: tx.from.toLowerCase(),
      txHash: tx.hash.toLowerCase(),
      blockNumber,
      timestamp,
      direction: "sent"
    });
    if (tx.to) {
      rows.push({
        id: `${tx.hash.toLowerCase()}-received-${tx.to.toLowerCase()}`,
        address: tx.to.toLowerCase(),
        txHash: tx.hash.toLowerCase(),
        blockNumber,
        timestamp,
        direction: "received"
      });
    }
  }
  return rows;
}

function buildTransferRows(txs: Transaction[], logsByTx: Log[][], timestamp: Date, blockNumber: bigint) {
  const token = [];
  const nft = [];

  for (let i = 0; i < txs.length; i++) {
    const tx = txs[i];
    for (const log of logsByTx[i]) {
      const topic0 = log.topics[0];
      if (topic0 === TRANSFER_TOPIC && log.topics.length >= 4) {
        const from = topicToAddress(log.topics[1]);
        const to = topicToAddress(log.topics[2]);
        const tokenId = topicToUint(log.topics[3]);
        if (!from || !to || !tokenId) continue;
        nft.push({
          id: `${tx.hash.toLowerCase()}-${log.logIndex}-nft`,
          txHash: tx.hash.toLowerCase(),
          blockNumber,
          timestamp,
          contract: log.address.toLowerCase(),
          from,
          to,
          tokenId,
          standard: "ERC-721"
        });
      } else if (topic0 === TRANSFER_TOPIC && log.topics.length === 3) {
        const from = topicToAddress(log.topics[1]);
        const to = topicToAddress(log.topics[2]);
        if (!from || !to) continue;
        token.push({
          id: `${tx.hash.toLowerCase()}-${log.logIndex}-erc20`,
          txHash: tx.hash.toLowerCase(),
          blockNumber,
          timestamp,
          token: log.address.toLowerCase(),
          from,
          to,
          value: BigInt(log.data).toString()
        });
      } else if (topic0 === ERC1155_TRANSFER_SINGLE_TOPIC || topic0 === ERC1155_TRANSFER_BATCH_TOPIC) {
        nft.push({
          id: `${tx.hash.toLowerCase()}-${log.logIndex}-erc1155`,
          txHash: tx.hash.toLowerCase(),
          blockNumber,
          timestamp,
          contract: log.address.toLowerCase(),
          from: topicToAddress(log.topics[2]) ?? "0x0000000000000000000000000000000000000000",
          to: topicToAddress(log.topics[3]) ?? "0x0000000000000000000000000000000000000000",
          tokenId: "See event",
          standard: "ERC-1155"
        });
      }
    }
  }

  return { token, nft };
}

function buildRawLogRows(txs: Transaction[], logsByTx: Log[][], blockNumber: bigint) {
  const rows = [];
  for (let i = 0; i < txs.length; i++) {
    const tx = txs[i];
    for (const log of logsByTx[i]) {
      const logIndex = log.logIndex ?? 0;
      rows.push({
        id: `${tx.hash.toLowerCase()}-${logIndex}`,
        txHash: tx.hash.toLowerCase(),
        blockNumber,
        address: log.address.toLowerCase(),
        topic0: log.topics[0],
        topic1: log.topics[1],
        topic2: log.topics[2],
        topic3: log.topics[3],
        data: log.data,
        logIndex
      });
    }
  }
  return rows;
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

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
