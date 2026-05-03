import { Badge } from "@/components/ui/badge";
import type { ExplorerTransaction } from "@/lib/types";
import { classifyRitualTx, ritualTxTypeLabel, type RitualTxKind } from "@/lib/ritual/txTypes";
import { cn } from "@/lib/utils";

const styles: Record<RitualTxKind, string> = {
  eip1559: "border-neutral-300 bg-neutral-50 text-neutral-700",
  scheduled: "border-amber-300 bg-amber-50 text-amber-800",
  asyncCommit: "border-orange-300 bg-orange-50 text-orange-800",
  asyncSettle: "border-pink-300 bg-pink-50 text-pink-800",
  agent: "border-ritual-green/30 bg-ritual-green/10 text-ritual-green",
  passkey: "border-emerald-300 bg-emerald-50 text-emerald-800",
  unknown: "border-ritual-line bg-ritual-soft text-ritual-muted"
};

export function RitualTxTypeBadge({ tx, kind }: { tx?: ExplorerTransaction; kind?: RitualTxKind }) {
  const resolvedKind = kind ?? (tx ? classifyRitualTx(tx) : "unknown");
  return <Badge className={cn("whitespace-nowrap", styles[resolvedKind])}>{ritualTxTypeLabel(resolvedKind)}</Badge>;
}
