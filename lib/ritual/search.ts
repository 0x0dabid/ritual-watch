export type SearchKind = "address" | "transaction" | "block" | "ritualName" | "invalid";

export function classifySearch(raw: string): { kind: SearchKind; value: string; error?: string } {
  const value = raw.trim();
  if (!value) return { kind: "invalid", value, error: "Enter a wallet, transaction hash, block number, or .ritual name." };
  if (/^0x[a-fA-F0-9]{40}$/.test(value)) return { kind: "address", value };
  if (/^0x[a-fA-F0-9]{64}$/.test(value)) return { kind: "transaction", value };
  if (/^\d+$/.test(value)) return { kind: "block", value };
  if (/^[a-zA-Z0-9-]+\.ritual$/.test(value)) return { kind: "ritualName", value: value.toLowerCase() };
  return { kind: "invalid", value, error: "That search does not look like a Ritual address, transaction, block, or .ritual name." };
}
