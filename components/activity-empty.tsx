import { EmptyState } from "@/components/empty-state";

export function ActivityEmpty({ title }: { title: string }) {
  return (
    <EmptyState
      title={title}
      description="No matching activity was found in the recent live RPC scan window. Increase the live scan window or run the Postgres indexer for complete history."
    />
  );
}
