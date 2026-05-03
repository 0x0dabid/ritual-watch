import { keccak256, namehash, toBytes, type Address, isAddress } from "viem";
import { prisma, hasDatabase } from "@/lib/db/prisma";
import { ritualConfig } from "@/lib/config";
import { publicClient } from "@/lib/ritual/client";
import { normalizeAddress } from "@/lib/utils";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

const candidateAbi = [
  {
    type: "function",
    name: "addr",
    stateMutability: "view",
    inputs: [{ name: "node", type: "bytes32" }],
    outputs: [{ type: "address" }]
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "address" }]
  },
  {
    type: "function",
    name: "available",
    stateMutability: "view",
    inputs: [{ name: "name", type: "string" }],
    outputs: [{ type: "bool" }]
  },
  {
    type: "function",
    name: "resolve",
    stateMutability: "view",
    inputs: [{ name: "name", type: "string" }],
    outputs: [{ type: "address" }]
  },
  {
    type: "function",
    name: "getAddress",
    stateMutability: "view",
    inputs: [{ name: "name", type: "string" }],
    outputs: [{ type: "address" }]
  },
  {
    type: "function",
    name: "addressOf",
    stateMutability: "view",
    inputs: [{ name: "name", type: "string" }],
    outputs: [{ type: "address" }]
  },
  {
    type: "function",
    name: "nameOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "string" }]
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256" }]
  },
  {
    type: "function",
    name: "tokenOfOwnerByIndex",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }, { name: "index", type: "uint256" }],
    outputs: [{ type: "uint256" }]
  },
  {
    type: "function",
    name: "text",
    stateMutability: "view",
    inputs: [{ name: "node", type: "bytes32" }, { name: "key", type: "string" }],
    outputs: [{ type: "string" }]
  }
] as const;

export async function resolveRitualName(name: string): Promise<Address | null> {
  const normalizedName = name.toLowerCase();
  if (!normalizedName.endsWith(".ritual")) return null;

  if (hasDatabase()) {
    try {
      const found = await prisma.ritualName.findUnique({ where: { name: normalizedName } });
      if (found?.owner && isAddress(found.owner)) return found.owner as Address;
    } catch (error) {
      console.warn("Database .ritual lookup unavailable, falling back to contract read.", error);
    }
  }

  if (!ritualConfig.namesContract) return null;

  const label = normalizedName.replace(/\.ritual$/, "");
  const attempts = [
    () => publicClient.readContract({ address: ritualConfig.namesContract!, abi: candidateAbi, functionName: "addressOf", args: [label] }),
    () => publicClient.readContract({ address: ritualConfig.namesContract!, abi: candidateAbi, functionName: "addressOf", args: [normalizedName] }),
    () => publicClient.readContract({ address: ritualConfig.namesContract!, abi: candidateAbi, functionName: "resolve", args: [normalizedName] }),
    () => publicClient.readContract({ address: ritualConfig.namesContract!, abi: candidateAbi, functionName: "getAddress", args: [normalizedName] }),
    () => publicClient.readContract({ address: ritualConfig.namesContract!, abi: candidateAbi, functionName: "addr", args: [namehash(normalizedName)] }),
    async () => {
      const available = await publicClient.readContract({
        address: ritualConfig.namesContract!,
        abi: candidateAbi,
        functionName: "available",
        args: [label]
      });
      if (available) return ZERO_ADDRESS;
      return publicClient.readContract({
        address: ritualConfig.namesContract!,
        abi: candidateAbi,
        functionName: "ownerOf",
        args: [BigInt(keccak256(toBytes(label)))]
      });
    }
  ];

  for (const attempt of attempts) {
    try {
      const resolved = await attempt();
      if (isAddress(resolved) && resolved !== ZERO_ADDRESS) return resolved;
    } catch {
      // Try the next known interface. The deployed names contract may be a registrar,
      // a registry, or a resolver-style facade depending on network version.
    }
  }

  return null;
}

export async function getNamesForAddress(address: string) {
  const normalized = normalizeAddress(address);
  if (!normalized) return [];
  if (hasDatabase()) {
    try {
      const names = await prisma.ritualName.findMany({ where: { owner: normalized }, orderBy: { name: "asc" } });
      if (names.length) return names;
    } catch (error) {
      console.warn("Database owned .ritual names unavailable, falling back to contract read.", error);
    }
  }
  if (!ritualConfig.namesContract || !isAddress(address)) return [];

  try {
    const owner = address as Address;
    const [primary, balance] = await Promise.all([
      getPrimaryName(address),
      publicClient.readContract({ address: ritualConfig.namesContract, abi: candidateAbi, functionName: "balanceOf", args: [owner] }).catch(() => 0n)
    ]);
    const ids = await Promise.all(
      Array.from({ length: Number(balance > 25n ? 25n : balance) }, (_, index) =>
        publicClient.readContract({
          address: ritualConfig.namesContract!,
          abi: candidateAbi,
          functionName: "tokenOfOwnerByIndex",
          args: [owner, BigInt(index)]
        }).catch(() => null)
      )
    );
    return ids.filter((id): id is bigint => id !== null).map((id, index) => ({
      name: index === 0 && primary ? `${primary}.ritual` : "Name indexed on-chain",
      tokenId: id.toString(),
      owner: normalized,
      resolver: null,
      primaryFor: index === 0 && primary ? normalized : null,
      updatedAt: new Date()
    }));
  } catch {
    return [];
  }
}

export async function getPrimaryName(address: string) {
  const normalized = normalizeAddress(address);
  if (!normalized) return null;
  if (hasDatabase()) {
    try {
      const primary = await prisma.ritualName.findFirst({ where: { primaryFor: normalized } });
      if (primary?.name) return primary.name.replace(/\.ritual$/, "");
    } catch (error) {
      console.warn("Database primary .ritual name unavailable, falling back to contract read.", error);
    }
  }
  if (!ritualConfig.namesContract || !isAddress(address)) return null;
  try {
    const name = await publicClient.readContract({
      address: ritualConfig.namesContract,
      abi: candidateAbi,
      functionName: "nameOf",
      args: [address as Address]
    });
    return name || null;
  } catch {
    return null;
  }
}

export async function getTextRecords(name: string) {
  if (!hasDatabase()) return [];
  try {
    return await prisma.ritualNameTextRecord.findMany({ where: { name: name.toLowerCase() }, orderBy: { key: "asc" } });
  } catch (error) {
    console.warn("Database .ritual text records unavailable.", error);
    return [];
  }
}
