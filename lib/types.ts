export type ExplorerBlock = {
  number: bigint;
  hash: string;
  parentHash: string;
  timestamp: Date;
  txCount: number;
  gasUsed: string;
  gasLimit: string;
  baseFee?: string | null;
  miner?: string | null;
  size?: number | null;
};

export type ExplorerTransaction = {
  hash: string;
  blockNumber: bigint;
  from: string;
  to?: string | null;
  value: string;
  gas?: string | null;
  gasPrice?: string | null;
  gasUsed?: string | null;
  effectiveGasPrice?: string | null;
  nonce?: number | null;
  input?: string | null;
  status?: string | null;
  timestamp: Date;
  method?: string | null;
  type?: string | null;
  spcCalls?: Array<{ address?: string | null; input?: string | null; output?: string | null }>;
  caller?: string | null;
};

export type DailyPoint = {
  day: string;
  txCount: number;
  activeWallets: number;
};

export type WalletProfile = {
  address: string;
  balance: bigint;
  totalTransactions: number;
  firstSeen?: Date | null;
  lastActive?: Date | null;
  sentCount: number;
  receivedCount: number;
};

export type IndexingCoverage = {
  mode: "indexed" | "live-rpc";
  startBlock?: bigint | null;
  lastIndexedBlock?: bigint | null;
  latestBlock: bigint;
  indexedBlocks: number;
  isCaughtUp: boolean;
  remainingBlocks: bigint;
  label: string;
  detail: string;
};
