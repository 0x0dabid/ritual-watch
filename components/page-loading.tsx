import { Loader2 } from "lucide-react";

export function PageLoading({ title = "Loading" }: { title?: string }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed border-ritual-line bg-white/35 p-8 text-center">
      <Loader2 className="mb-3 size-6 animate-spin text-ritual-green" />
      <p className="font-semibold">{title}</p>
      <p className="mt-1 max-w-md text-sm text-ritual-muted">Scanning recent Ritual activity...</p>
    </div>
  );
}
