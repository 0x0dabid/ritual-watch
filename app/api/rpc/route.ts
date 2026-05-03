import { NextResponse } from "next/server";
import { ritualConfig } from "@/lib/config";

export async function POST(req: Request) {
  const body = await req.text();
  const resp = await fetch(ritualConfig.rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body
  });
  return new NextResponse(await resp.text(), {
    status: resp.status,
    headers: { "Content-Type": "application/json" }
  });
}
