import { scanRecentNetworkTransactions } from "@/lib/ritual/liveRpc";
import { classifyRitualTx } from "@/lib/ritual/txTypes";

export async function getAsyncActivity() {
  const transactions = await scanRecentNetworkTransactions({ kind: "async", limit: 40, maxBlocks: 300 });
  const commitCount = transactions.filter((tx) => classifyRitualTx(tx) === "asyncCommit").length;
  const settleCount = transactions.filter((tx) => classifyRitualTx(tx) === "asyncSettle").length;
  return {
    transactions,
    stats: {
      total: transactions.length,
      commitCount,
      settleCount,
      lastUpdated: new Date()
    }
  };
}

export async function getScheduledActivity() {
  const transactions = await scanRecentNetworkTransactions({ kind: "scheduled", limit: 40, maxBlocks: 300 });
  return {
    transactions,
    stats: {
      active: transactions.length,
      total: transactions.length,
      completedRecently: 0,
      lastUpdated: new Date()
    }
  };
}

export async function getAgentActivity() {
  const transactions = await scanRecentNetworkTransactions({ kind: "agent", limit: 40, maxBlocks: 500 });
  const persistent = transactions.filter((tx) => tx.spcCalls?.some((call) => call.address?.toLowerCase() === "0x0000000000000000000000000000000000000820")).length;
  const sovereign = transactions.length - persistent;
  return {
    transactions,
    stats: {
      total: transactions.length,
      persistent,
      sovereign,
      lastUpdated: new Date()
    }
  };
}
