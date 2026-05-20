import type { KiteNetwork } from "./kite-chain";

const MAINNET_API = "https://kitescan.ai/api/v2";
const TESTNET_API = "https://testnet.kitescan.ai/api/v2";

function apiBase(network: KiteNetwork = "mainnet"): string {
  return network === "testnet" ? TESTNET_API : MAINNET_API;
}

export class KiteScanError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "KiteScanError";
    this.status = status;
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) {
    if (res.status === 404) throw new KiteScanError("Not found", 404);
    throw new KiteScanError(`KiteScan ${res.status}`, res.status);
  }
  return res.json() as Promise<T>;
}

// === ADDRESS ===

export interface BlockscoutAddress {
  hash: string;
  is_contract: boolean;
  is_verified: boolean;
  name: string | null;
  ens_domain_name: string | null;
  coin_balance: string | null;
  exchange_rate: string | null;
  block_number_balance_updated_at: number | null;
  has_tokens: boolean;
  has_token_transfers: boolean;
  token: {
    name: string;
    symbol: string;
    decimals: string;
    type: string;
    address: string;
  } | null;
}

export async function getAddress(
  address: string,
  network: KiteNetwork = "mainnet"
): Promise<BlockscoutAddress> {
  return fetchJson<BlockscoutAddress>(`${apiBase(network)}/addresses/${address}`);
}

export interface BlockscoutAddressCounters {
  transactions_count: string;
  token_transfers_count: string;
  gas_usage_count: string;
  validations_count: string;
}

export async function getAddressCounters(
  address: string,
  network: KiteNetwork = "mainnet"
): Promise<BlockscoutAddressCounters> {
  return fetchJson<BlockscoutAddressCounters>(`${apiBase(network)}/addresses/${address}/counters`);
}

// === TRANSACTIONS ===

export interface BlockscoutTransaction {
  hash: string;
  block_number: number;
  timestamp: string;
  from: { hash: string; ens_domain_name: string | null; is_contract: boolean };
  to: { hash: string; ens_domain_name: string | null; is_contract: boolean } | null;
  value: string;
  fee: { value: string } | null;
  gas_used: string | null;
  status: "ok" | "error" | null;
  method: string | null;
  transaction_types: string[];
}

export interface BlockscoutTxList {
  items: BlockscoutTransaction[];
  next_page_params: Record<string, unknown> | null;
}

export async function getAddressTransactions(
  address: string,
  opts: { network?: KiteNetwork } = {}
): Promise<BlockscoutTxList> {
  const network = opts.network ?? "mainnet";
  return fetchJson<BlockscoutTxList>(`${apiBase(network)}/addresses/${address}/transactions`);
}

// === TOKEN TRANSFERS ===

export interface BlockscoutTokenTransfer {
  transaction_hash: string;
  block_number: number;
  timestamp: string;
  from: { hash: string };
  to: { hash: string };
  total: { value: string; decimals: string };
  token: { address: string; name: string; symbol: string; type: string; decimals: string };
  type: string;
}

export interface BlockscoutTokenTransferList {
  items: BlockscoutTokenTransfer[];
  next_page_params: Record<string, unknown> | null;
}

export async function getAddressTokenTransfers(
  address: string,
  opts: { network?: KiteNetwork } = {}
): Promise<BlockscoutTokenTransferList> {
  const network = opts.network ?? "mainnet";
  return fetchJson<BlockscoutTokenTransferList>(
    `${apiBase(network)}/addresses/${address}/token-transfers`
  );
}

// === TOKENS HELD ===

export interface BlockscoutTokenBalance {
  token: { address: string; name: string; symbol: string; type: string; decimals: string };
  value: string;
}

interface BlockscoutTokenList {
  items: BlockscoutTokenBalance[];
  next_page_params: Record<string, unknown> | null;
}

export async function getAddressTokens(
  address: string,
  network: KiteNetwork = "mainnet"
): Promise<BlockscoutTokenBalance[]> {
  const data = await fetchJson<BlockscoutTokenList | BlockscoutTokenBalance[]>(
    `${apiBase(network)}/addresses/${address}/tokens`
  );
  if (Array.isArray(data)) return data;
  return data.items ?? [];
}
