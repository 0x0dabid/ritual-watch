import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatEther, getAddress, isAddress } from "viem";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shorten(value?: string | null, head = 6, tail = 4) {
  if (!value) return "—";
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

export function displayAddress(address?: string | null) {
  if (!address) return "—";
  return isAddress(address) ? getAddress(address) : address;
}

export function normalizeAddress(address?: string | null) {
  return address?.toLowerCase() ?? null;
}

export function formatRitual(value?: bigint | string | number | null) {
  if (value === null || value === undefined) return "0 RITUAL";
  const asBigInt = typeof value === "bigint" ? value : BigInt(value);
  const formatted = Number(formatEther(asBigInt));
  return `${formatted.toLocaleString(undefined, { maximumFractionDigits: 5 })} RITUAL`;
}

export function formatNumber(value?: number | bigint | null) {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString();
}

export function formatAge(date?: Date | string | number | null) {
  if (!date) return "—";
  const time = date instanceof Date ? date.getTime() : new Date(date).getTime();
  const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function explorerUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_RITUAL_EXPLORER_URL ?? "https://explorer.ritualfoundation.org";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}
