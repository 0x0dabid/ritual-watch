import { BlocksTable } from "@/components/blocks-table";
import { SectionHeader } from "@/components/section-header";
import { getLatestBlocks } from "@/lib/data";

export default async function BlocksPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const blocks = await getLatestBlocks(30, page);
  return (
    <div>
      <SectionHeader title="Latest Blocks" />
      <BlocksTable blocks={blocks} />
    </div>
  );
}
