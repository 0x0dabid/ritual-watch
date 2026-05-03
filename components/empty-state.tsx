import { Inbox } from "lucide-react";

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-ritual-line bg-white/35 p-8 text-center">
      <Inbox className="mb-3 size-6 text-ritual-muted" />
      <p className="font-semibold">{title}</p>
      {description ? <p className="mt-1 max-w-md text-sm text-ritual-muted">{description}</p> : null}
    </div>
  );
}
