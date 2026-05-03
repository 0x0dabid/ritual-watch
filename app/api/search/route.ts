import { NextRequest, NextResponse } from "next/server";
import { classifySearch } from "@/lib/ritual/search";
import { resolveRitualName } from "@/lib/ritual/ritualNames";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const classified = classifySearch(q);

  if (classified.kind === "invalid") {
    return NextResponse.json({ ok: false, error: classified.error }, { status: 400 });
  }

  if (classified.kind === "ritualName") {
    const address = await resolveRitualName(classified.value);
    if (!address) return NextResponse.json({ ok: false, error: "No .ritual name found." }, { status: 404 });
    return NextResponse.json({ ok: true, kind: "address", target: `/address/${address}` });
  }

  const target =
    classified.kind === "address"
      ? `/address/${classified.value}`
      : classified.kind === "transaction"
        ? `/tx/${classified.value}`
        : `/block/${classified.value}`;
  return NextResponse.json({ ok: true, kind: classified.kind, target });
}
