import { createPublicClient, http } from "viem";
import { ritualChain, ritualConfig } from "@/lib/config";

export const publicClient = createPublicClient({
  chain: ritualChain,
  transport: http(ritualConfig.rpcUrl, { batch: true })
});
