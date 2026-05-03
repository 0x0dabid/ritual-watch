import { EmptyState } from "@/components/empty-state";
import { SectionHeader } from "@/components/section-header";

export default function TokensPage() {
  return (
    <div>
      <SectionHeader title="Tokens" />
      <EmptyState title="Token summary coming online" description="Run the indexer to collect ERC-20 transfers and token metadata." />
    </div>
  );
}
