import { formatEther, formatUnits } from "viem";
import {
  getAddressTokenTransfers,
  getAddressTransactions,
} from "./kitescan-api";
import type { KiteNetwork } from "./kite-chain";

export type LiveActivityType =
  | "transfer_in"
  | "transfer_out"
  | "token_transfer_in"
  | "token_transfer_out"
  | "contract_call"
  | "self";

export interface LiveActivityItem {
  id: string;
  type: LiveActivityType;
  description: string;
  amount?: string;
  symbol?: string;
  timestamp: string;
  tx_hash: string;
  block_number: number;
  counterparty?: string;
  status: "ok" | "error";
  is_live_data: true;
}

function safeBigInt(s: string | null | undefined): bigint {
  if (!s) return 0n;
  try {
    return BigInt(s);
  } catch {
    return 0n;
  }
}

export async function fetchActivity(
  address: string,
  network: KiteNetwork = "mainnet"
): Promise<LiveActivityItem[]> {
  const lowerAddr = address.toLowerCase();

  const [txs, tokenTransfers] = await Promise.all([
    getAddressTransactions(address, { network }).catch(() => ({ items: [] })),
    getAddressTokenTransfers(address, { network }).catch(() => ({ items: [] })),
  ]);

  const nativeItems: LiveActivityItem[] = txs.items.slice(0, 25).map((tx) => {
    const from = tx.from.hash.toLowerCase();
    const to = tx.to?.hash.toLowerCase();
    const isOutgoing = from === lowerAddr;
    const isSelf = !!to && from === to;
    const counterparty = isOutgoing ? to : from;
    const valueWei = safeBigInt(tx.value);
    const valueKite = parseFloat(formatEther(valueWei));

    let type: LiveActivityType = "contract_call";
    let description = tx.method ? `Called ${tx.method}` : "Contract interaction";

    if (isSelf) {
      type = "self";
      description = tx.method ? `Self: ${tx.method}` : "Self transaction";
    } else if (valueKite > 0) {
      type = isOutgoing ? "transfer_out" : "transfer_in";
      description = isOutgoing
        ? `Sent ${valueKite.toFixed(4)} KITE`
        : `Received ${valueKite.toFixed(4)} KITE`;
    }

    return {
      id: tx.hash,
      type,
      description,
      amount: valueKite > 0 ? valueKite.toFixed(4) : undefined,
      symbol: valueKite > 0 ? "KITE" : undefined,
      timestamp: tx.timestamp,
      tx_hash: tx.hash,
      block_number: tx.block_number,
      counterparty: counterparty || undefined,
      status: tx.status ?? "ok",
      is_live_data: true,
    };
  });

  const tokenItems: LiveActivityItem[] = tokenTransfers.items.slice(0, 25).map((t) => {
    const from = t.from.hash.toLowerCase();
    const isOutgoing = from === lowerAddr;
    const decimals = parseInt(t.token.decimals, 10) || 18;
    const amount = parseFloat(formatUnits(safeBigInt(t.total.value), decimals));

    return {
      id: `${t.transaction_hash}-${t.token.address}-${isOutgoing ? "out" : "in"}`,
      type: isOutgoing ? "token_transfer_out" : "token_transfer_in",
      description: isOutgoing
        ? `Sent ${amount.toFixed(2)} ${t.token.symbol}`
        : `Received ${amount.toFixed(2)} ${t.token.symbol}`,
      amount: amount.toFixed(2),
      symbol: t.token.symbol,
      timestamp: t.timestamp,
      tx_hash: t.transaction_hash,
      block_number: t.block_number,
      counterparty: isOutgoing ? t.to.hash : from,
      status: "ok",
      is_live_data: true,
    };
  });

  return [...nativeItems, ...tokenItems]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 30);
}
