import { keccak256, toBytes } from "viem";

export const TRANSFER_TOPIC = keccak256(toBytes("Transfer(address,address,uint256)"));
export const ERC1155_TRANSFER_SINGLE_TOPIC = keccak256(toBytes("TransferSingle(address,address,address,uint256,uint256)"));
export const ERC1155_TRANSFER_BATCH_TOPIC = keccak256(toBytes("TransferBatch(address,address,address,uint256[],uint256[])"));

export function topicToAddress(topic?: string | null) {
  if (!topic || topic.length !== 66) return null;
  return `0x${topic.slice(26)}`.toLowerCase();
}

export function topicToUint(topic?: string | null) {
  if (!topic) return null;
  return BigInt(topic).toString();
}
