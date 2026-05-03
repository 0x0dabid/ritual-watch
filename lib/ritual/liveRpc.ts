import { createPublicClient, formatUnits, getAddress, http, parseAbi } from "viem";
import { ritualChain } from "@/lib/config";
import { ERC1155_TRANSFER_SINGLE_TOPIC, TRANSFER_TOPIC, topicToUint } from "@/lib/indexer/events";
import type { ExplorerTransaction } from "@/lib/types";
import { classifyRitualTx, type RitualTxKind } from "@/lib/ritual/txTypes";

const SCANNER_RPC_URL = process.env.RITUAL_SCANNER_RPC_URL ?? "https://scanner-rpc.ritualfoundation.org/";

const scannerClient = createPublicClient({
  chain: ritualChain,
  transport: http(SCANNER_RPC_URL)
});

const erc20Abi = parseAbi([
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)"
]);

const TX_LOOKBACK_BLOCKS = BigInt(process.env.RITUAL_LIVE_TX_SCAN_BLOCKS ?? "500");
const LOG_LOOKBACK_BLOCKS = BigInt(process.env.RITUAL_LIVE_LOG_SCAN_BLOCKS ?? "5000");
const BLOCK_BATCH_SIZE = 50;
const LOG_RANGE = 10000n;

export async function scanRecentWalletTransactions(address: string, limit = 50): Promise<ExplorerTransaction[]> {
  const target = address.toLowerCase();
  const latest = await scannerClient.getBlockNumber();
  const fromBlock = latest > TX_LOOKBACK_BLOCKS ? latest - TX_LOOKBACK_BLOCKS : 0n;
  const matches: ExplorerTransaction[] = [];

  for (let end = latest; end >= fromBlock && matches.length < limit; end -= BigInt(BLOCK_BATCH_SIZE)) {
    const start = end > BigInt(BLOCK_BATCH_SIZE) ? end - BigInt(BLOCK_BATCH_SIZE) + 1n : 0n;
    const realStart = start < fromBlock ? fromBlock : start;
    const blockNumbers = Array.from({ length: Number(end - realStart + 1n) }, (_, i) => end - BigInt(i));
    const blocks = await getBlocksBatch(blockNumbers);

    for (const block of blocks) {
      if (!block) continue;
      const timestamp = new Date(Number(block.timestamp) * 1000);
      for (const tx of block.transactions) {
        if (typeof tx === "string") continue;
        if (tx.from.toLowerCase() !== target && tx.to?.toLowerCase() !== target) continue;
        matches.push({
          hash: tx.hash,
          blockNumber: toBigInt(tx.blockNumber ?? block.number),
          from: tx.from,
          to: tx.to,
          value: toBigInt(tx.value).toString(),
          gas: toBigInt(tx.gas).toString(),
          gasPrice: tx.gasPrice ? toBigInt(tx.gasPrice).toString() : undefined,
          nonce: Number(toBigInt(tx.nonce)),
          input: tx.input,
          type: tx.type,
          spcCalls: normalizeSpcCalls(tx.spcCalls),
          caller: tx.caller,
          status: "indexed",
          timestamp,
          method: tx.input && tx.input !== "0x" ? tx.input.slice(0, 10) : "Transfer"
        });
        if (matches.length >= limit) break;
      }
      if (matches.length >= limit) break;
    }
    if (realStart === 0n) break;
  }

  const receipts = await Promise.all(matches.map((tx) => scannerClient.getTransactionReceipt({ hash: tx.hash as `0x${string}` }).catch(() => null)));
  return matches.map((tx, i) => ({
    ...tx,
    status: receipts[i]?.status ?? tx.status,
    gasUsed: receipts[i]?.gasUsed?.toString(),
    effectiveGasPrice: receipts[i]?.effectiveGasPrice?.toString()
  }));
}

export async function scanRecentNetworkTransactions({
  limit = 50,
  kind,
  maxBlocks = Number(TX_LOOKBACK_BLOCKS)
}: {
  limit?: number;
  kind?: RitualTxKind | "async";
  maxBlocks?: number;
} = {}): Promise<ExplorerTransaction[]> {
  const latest = await scannerClient.getBlockNumber();
  const lookback = BigInt(maxBlocks);
  const fromBlock = latest > lookback ? latest - lookback : 0n;
  const matches: ExplorerTransaction[] = [];

  for (let end = latest; end >= fromBlock && matches.length < limit; end -= BigInt(BLOCK_BATCH_SIZE)) {
    const start = end > BigInt(BLOCK_BATCH_SIZE) ? end - BigInt(BLOCK_BATCH_SIZE) + 1n : 0n;
    const realStart = start < fromBlock ? fromBlock : start;
    const blockNumbers = Array.from({ length: Number(end - realStart + 1n) }, (_, i) => end - BigInt(i));
    const blocks = await getBlocksBatch(blockNumbers);

    for (const block of blocks) {
      if (!block) continue;
      const timestamp = new Date(Number(block.timestamp) * 1000);
      for (const tx of block.transactions ?? []) {
        if (typeof tx === "string") continue;
        const mapped = mapRpcTransaction(tx, block, timestamp);
        const txKind = classifyRitualTx(mapped);
        const keep = !kind || (kind === "async" ? txKind === "asyncCommit" || txKind === "asyncSettle" : txKind === kind);
        if (!keep) continue;
        matches.push(mapped);
        if (matches.length >= limit) break;
      }
      if (matches.length >= limit) break;
    }
    if (realStart === 0n) break;
  }

  const receipts = await Promise.all(matches.map((tx) => scannerClient.getTransactionReceipt({ hash: tx.hash as `0x${string}` }).catch(() => null)));
  return matches.map((tx, i) => ({
    ...tx,
    status: receipts[i]?.status ?? tx.status,
    gasUsed: receipts[i]?.gasUsed?.toString(),
    effectiveGasPrice: receipts[i]?.effectiveGasPrice?.toString()
  }));
}

export async function scanTokenHoldings(address: string) {
  const normalized = address.toLowerCase();
  const [incoming, outgoing] = await Promise.all([
    getTransferLogsForAddress(normalized, "to"),
    getTransferLogsForAddress(normalized, "from")
  ]);
  const balances = new Map<string, bigint>();

  for (const log of incoming) {
    if (log.topics.length !== 3 || !log.data) continue;
    const token = log.address.toLowerCase();
    balances.set(token, (balances.get(token) ?? 0n) + BigInt(log.data));
  }
  for (const log of outgoing) {
    if (log.topics.length !== 3 || !log.data) continue;
    const token = log.address.toLowerCase();
    balances.set(token, (balances.get(token) ?? 0n) - BigInt(log.data));
  }

  const entries = [...balances.entries()].filter(([, balance]) => balance > 0n).slice(0, 50);
  const metadata = await Promise.all(entries.map(([contract]) => getTokenMetadata(contract as `0x${string}`)));
  return entries.map(([contract, balance], i) => ({
    contract,
    balance,
    formattedBalance: metadata[i].decimals === null ? balance.toString() : formatUnits(balance, metadata[i].decimals),
    symbol: metadata[i].symbol ?? "TOKEN",
    name: metadata[i].name ?? "Unknown token"
  }));
}

export async function scanNftHoldings(address: string) {
  const normalized = address.toLowerCase();
  const [incoming, outgoing] = await Promise.all([
    getTransferLogsForAddress(normalized, "to"),
    getTransferLogsForAddress(normalized, "from")
  ]);
  const owned = new Map<string, { contract: string; tokenId: string; standard: string }>();

  for (const log of incoming) {
    if (log.topics[0] === TRANSFER_TOPIC && log.topics.length >= 4) {
      const tokenId = topicToUint(log.topics[3]);
      if (tokenId) owned.set(`${log.address.toLowerCase()}:${tokenId}`, { contract: log.address.toLowerCase(), tokenId, standard: "ERC-721" });
    }
    if (log.topics[0] === ERC1155_TRANSFER_SINGLE_TOPIC) {
      owned.set(`${log.address.toLowerCase()}:${log.logIndex}`, { contract: log.address.toLowerCase(), tokenId: "See event", standard: "ERC-1155" });
    }
  }
  for (const log of outgoing) {
    if (log.topics[0] === TRANSFER_TOPIC && log.topics.length >= 4) {
      const tokenId = topicToUint(log.topics[3]);
      if (tokenId) owned.delete(`${log.address.toLowerCase()}:${tokenId}`);
    }
  }

  return [...owned.values()].slice(0, 100);
}

async function getTransferLogsForAddress(address: string, side: "from" | "to") {
  const latest = await scannerClient.getBlockNumber();
  const from = latest > LOG_LOOKBACK_BLOCKS ? latest - LOG_LOOKBACK_BLOCKS : 0n;
  const topicIndex = side === "from" ? 1 : 2;
  const topics = [TRANSFER_TOPIC, null, null] as Array<`0x${string}` | null>;
  topics[topicIndex] = padAddressTopic(address);
  const logs = [];

  for (let start = from; start <= latest; start += LOG_RANGE + 1n) {
    const end = start + LOG_RANGE > latest ? latest : start + LOG_RANGE;
    const chunk = await scannerClient
      .request({
        method: "eth_getLogs",
        params: [
          {
            fromBlock: `0x${start.toString(16)}`,
            toBlock: `0x${end.toString(16)}`,
            topics
          }
        ]
      })
      .catch(() => []);
    logs.push(...chunk);
  }
  return logs;
}

async function getTokenMetadata(address: `0x${string}`) {
  const [symbol, name, decimals] = await Promise.all([
    scannerClient.readContract({ address, abi: erc20Abi, functionName: "symbol" }).catch(() => null),
    scannerClient.readContract({ address, abi: erc20Abi, functionName: "name" }).catch(() => null),
    scannerClient.readContract({ address, abi: erc20Abi, functionName: "decimals" }).catch(() => null)
  ]);
  return { symbol, name, decimals: decimals === null ? null : Number(decimals) };
}

function padAddressTopic(address: string) {
  const checksummed = getAddress(address);
  return `0x${checksummed.slice(2).toLowerCase().padStart(64, "0")}` as `0x${string}`;
}

function toBigInt(value: bigint | number | string) {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(value);
  return BigInt(value);
}

function mapRpcTransaction(tx: any, block: any, timestamp: Date): ExplorerTransaction {
  return {
    hash: tx.hash,
    blockNumber: toBigInt(tx.blockNumber ?? block.number),
    from: tx.from,
    to: tx.to,
    value: toBigInt(tx.value ?? "0x0").toString(),
    gas: toBigInt(tx.gas ?? "0x0").toString(),
    gasPrice: tx.gasPrice ? toBigInt(tx.gasPrice).toString() : undefined,
    nonce: Number(toBigInt(tx.nonce ?? 0)),
    input: tx.input,
    type: tx.type,
    spcCalls: normalizeSpcCalls(tx.spcCalls),
    caller: tx.caller,
    status: "indexed",
    timestamp,
    method: tx.input && tx.input !== "0x" ? tx.input.slice(0, 10) : "Transfer"
  };
}

function normalizeSpcCalls(value: unknown): ExplorerTransaction["spcCalls"] {
  if (!Array.isArray(value)) return undefined;
  return value.map((call: any) => ({
    address: call?.address,
    input: call?.input,
    output: call?.output
  }));
}

async function getBlocksBatch(blockNumbers: bigint[]) {
  const body = blockNumbers.map((blockNumber, index) => ({
    jsonrpc: "2.0",
    method: "eth_getBlockByNumber",
    params: [`0x${blockNumber.toString(16)}`, true],
    id: index + 1
  }));
  const response = await fetch(SCANNER_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000)
  }).catch(() => null);
  if (!response?.ok) return [];
  const json = (await response.json()) as Array<{ id: number; result?: any }>;
  return json.sort((a, b) => a.id - b.id).map((item) => item.result).filter(Boolean);
}
