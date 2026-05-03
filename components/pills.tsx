import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { displayAddress, shorten } from "@/lib/utils";

export function AddressPill({ address }: { address?: string | null }) {
  if (!address) return <span className="text-ritual-muted">—</span>;
  return (
    <Link href={`/address/${address}`} className="font-mono text-xs font-semibold text-ritual-green hover:underline">
      {shorten(displayAddress(address))}
    </Link>
  );
}

export function TxHashPill({ hash }: { hash: string }) {
  return (
    <Link href={`/tx/${hash}`} className="font-mono text-xs font-semibold text-ritual-green hover:underline">
      {shorten(hash)}
    </Link>
  );
}

export function StatusBadge({ status }: { status?: string | null }) {
  const ok = status === "success" || status === "1" || status === "indexed";
  const failed = status === "reverted" || status === "0" || status === "failure";
  return (
    <Badge className={ok ? "border-ritual-green/25 bg-ritual-green/10 text-ritual-green" : failed ? "border-red-200 bg-red-50 text-red-700" : ""}>
      {failed ? "Failed" : ok ? "Success" : status ?? "Pending"}
    </Badge>
  );
}
