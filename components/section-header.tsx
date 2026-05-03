import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function SectionHeader({ title, href, action }: { title: string; href?: string; action?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-xl font-black">{title}</h2>
      {href ? (
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-ritual-green hover:underline">
          {action ?? "View all"} <ArrowUpRight className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}
