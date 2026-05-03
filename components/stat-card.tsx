import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({ label, value, icon: Icon, sub }: { label: string; value: string; icon: LucideIcon; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase text-ritual-muted">{label}</p>
            <p className="mt-3 text-2xl font-black tracking-normal">{value}</p>
            {sub ? <p className="mt-1 text-xs text-ritual-muted">{sub}</p> : null}
          </div>
          <div className="rounded-md border border-ritual-green/20 bg-ritual-green/10 p-2 text-ritual-green">
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
