import { defineChain } from "viem";

export const ritualConfig = {
  chainName: "Ritual Testnet",
  chainId: Number(process.env.NEXT_PUBLIC_RITUAL_CHAIN_ID ?? 1979),
  rpcUrl: process.env.RITUAL_RPC_URL ?? process.env.NEXT_PUBLIC_RITUAL_RPC_URL ?? "https://rpc.ritualfoundation.org",
  explorerUrl: process.env.NEXT_PUBLIC_RITUAL_EXPLORER_URL ?? "https://explorer.ritualfoundation.org",
  namesContract: (process.env.NEXT_PUBLIC_RITUAL_NAMES_CONTRACT ?? "0xb9976C592f4E90B51bDa05B0B3d8b7735D24743A") as `0x${string}`
} as const;

export const ritualChain = defineChain({
  id: ritualConfig.chainId,
  name: ritualConfig.chainName,
  nativeCurrency: { decimals: 18, name: "RITUAL", symbol: "RITUAL" },
  rpcUrls: { default: { http: [ritualConfig.rpcUrl] } },
  blockExplorers: { default: { name: "Ritual Explorer", url: ritualConfig.explorerUrl } }
});
