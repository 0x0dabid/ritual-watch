import { EmptyState } from "@/components/empty-state";
import { SectionHeader } from "@/components/section-header";

export default function NftsPage() {
  return (
    <div>
      <SectionHeader title="NFTs" />
      <EmptyState title="NFT summary coming online" description="Run the indexer to collect ERC-721 and ERC-1155 activity." />
    </div>
  );
}
