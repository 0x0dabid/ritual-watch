import type { ExplorerTransaction } from "@/lib/types";

export type RitualTxKind = "eip1559" | "scheduled" | "asyncCommit" | "asyncSettle" | "agent" | "passkey" | "unknown";

const AGENT_PRECOMPILES = new Set([
  "0x000000000000000000000000000000000000080c",
  "0x0000000000000000000000000000000000000820"
]);

export function normalizeTxType(type?: string | number | null) {
  if (type === null || type === undefined) return "0x2";
  if (typeof type === "number") return `0x${type.toString(16)}`;
  return type.toLowerCase();
}

export function classifyRitualTx(tx: Pick<ExplorerTransaction, "type" | "to" | "spcCalls">): RitualTxKind {
  const type = normalizeTxType(tx.type);
  if (type === "0x10") {
    return hasAgentPrecompile(tx) ? "agent" : "scheduled";
  }
  if (type === "0x11") return "asyncCommit";
  if (type === "0x12") return "asyncSettle";
  if (type === "0x77") return "passkey";
  if (hasAgentPrecompile(tx)) return "agent";
  if (type === "0x0" || type === "0x2") return "eip1559";
  return "unknown";
}

export function ritualTxTypeLabel(kind: RitualTxKind) {
  return {
    eip1559: "EIP-1559",
    scheduled: "Scheduled",
    asyncCommit: "Async Commit",
    asyncSettle: "Async Settle",
    agent: "Agent",
    passkey: "Passkey",
    unknown: "Unknown"
  }[kind];
}

export function hasAgentPrecompile(tx: Pick<ExplorerTransaction, "to" | "spcCalls">) {
  const to = tx.to?.toLowerCase();
  if (to && AGENT_PRECOMPILES.has(to)) return true;
  return Boolean(tx.spcCalls?.some((call) => AGENT_PRECOMPILES.has(call.address?.toLowerCase() ?? "")));
}
