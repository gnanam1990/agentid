import { createPublicClient, http, defineChain, formatEther, formatUnits, type Address } from "viem";

export const kiteMainnet = defineChain({
  id: 2366,
  name: "Kite Mainnet",
  nativeCurrency: { name: "Kite", symbol: "KITE", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.gokite.ai"] } },
  blockExplorers: { default: { name: "KiteScan", url: "https://kitescan.ai" } },
});

export const kiteTestnet = defineChain({
  id: 2368,
  name: "Kite Testnet",
  nativeCurrency: { name: "Kite", symbol: "KITE", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc-testnet.gokite.ai"] } },
  blockExplorers: { default: { name: "KiteScan Testnet", url: "https://testnet.kitescan.ai" } },
});

export const publicClient = createPublicClient({
  chain: kiteMainnet,
  transport: http(),
});

export const testnetClient = createPublicClient({
  chain: kiteTestnet,
  transport: http(),
});

export type KiteNetwork = "mainnet" | "testnet";

// Test USDT on Kite testnet uses 18 decimals (not 6 like USDT on Ethereum).
export const TESTNET_USDT_ADDRESS = "0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63" as Address;
export const TESTNET_USDT_DECIMALS = 18;

export function explorerBase(network: KiteNetwork): string {
  return network === "testnet" ? "https://testnet.kitescan.ai" : "https://kitescan.ai";
}

export function explorerAddressUrl(address: string, network: KiteNetwork = "mainnet"): string {
  return `${explorerBase(network)}/address/${address}`;
}

export function explorerTxUrl(hash: string, network: KiteNetwork = "mainnet"): string {
  return `${explorerBase(network)}/tx/${hash}`;
}

export function isValidAddress(s: string): s is Address {
  return /^0x[a-fA-F0-9]{40}$/.test(s);
}

export function formatKite(wei: bigint): string {
  return parseFloat(formatEther(wei)).toFixed(4);
}

export function formatUsdt(wei: bigint): string {
  return parseFloat(formatUnits(wei, TESTNET_USDT_DECIMALS)).toFixed(2);
}
