"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { classifySearch } from "@/lib/ritual/search";

export function GlobalSearch({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const classified = classifySearch(value);
    if (classified.kind === "invalid") {
      setError(classified.error ?? "Invalid search.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
      const data = (await res.json()) as { ok: boolean; target?: string; error?: string };
      if (!res.ok || !data.ok || !data.target) {
        setError(data.error ?? "No result found.");
        return;
      }
      router.push(data.target);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ritual-muted" />
          <Input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="pl-9"
            placeholder="Search wallet, tx, block, or .ritual name"
            aria-label="Global explorer search"
          />
        </div>
        <Button type="submit" disabled={loading} className={compact ? "px-3" : ""}>
          {loading ? "Searching" : "Search"}
        </Button>
      </div>
      {error ? <p className="mt-2 text-sm font-medium text-red-700">{error}</p> : null}
    </form>
  );
}
