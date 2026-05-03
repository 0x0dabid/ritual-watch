import { BlocksTable } from "@/components/blocks-table";
import { IndexedWindowNote } from "@/components/indexing-coverage-card";
import { SectionHeader } from "@/components/section-header";
import { getIndexingCoverage, getLatestBlocks } from "@/lib/data";

export default async function BlocksPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const [blocks, coverage] = await Promise.all([getLatestBlocks(30, page), getIndexingCoverage()]);
  return (
    <div className="space-y-4">
      <SectionHeader title="Latest Indexed Blocks" />
      <IndexedWindowNote coverage={coverage} />
      <BlocksTable blocks={blocks} />
    </div>
  );
}
