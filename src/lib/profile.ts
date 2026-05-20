import type { Address } from "viem";
import {
  getAddress,
  getAddressCounters,
  getAddressTokens,
  KiteScanError,
} from "./kitescan-api";
import { formatKite, isValidAddress, type KiteNetwork } from "./kite-chain";

export type TrustTier = "untrusted" | "rookie" | "verified" | "trusted" | "elite";

export interface LiveAgentProfile {
  address: string;
  display_name: string;
  bio: string;
  avatar_url: string;

  is_contract: boolean;
  contract_name: string | null;
  kite_balance: string;
  kite_balance_wei: bigint;
  token_count: number;

  tier: TrustTier;
  score: number;
  is_kpass_verified: boolean;

  socials: { ens: string | null; farcaster: string | null; x: string | null };

  stats: {
    total_transactions: number;
    token_transfers: number;
    services_used: number;
    products_bought: number;
  };

  first_seen: string | null;
  network: KiteNetwork;
  fetched_at: string;

  has_onchain_history: boolean;

  is_live_data: true;
}

export interface ProfileError {
  is_live_data: false;
  error: "invalid_address" | "not_found" | "network_error";
  message: string;
  network: KiteNetwork;
}

export type ProfileResult = LiveAgentProfile | ProfileError;

function mockTierFromActivity(txCount: number): { tier: TrustTier; score: number } {
  if (txCount === 0) return { tier: "untrusted", score: 100 };
  if (txCount < 10) return { tier: "rookie", score: 300 + txCount * 10 };
  if (txCount < 100) return { tier: "verified", score: 500 + (txCount - 10) };
  if (txCount < 1000) return { tier: "trusted", score: 700 + Math.min((txCount - 100) / 5, 150) };
  return { tier: "elite", score: Math.min(950, 850 + txCount / 100) };
}

function shortAddr(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function emptyProfile(address: Address, network: KiteNetwork): LiveAgentProfile {
  return {
    address,
    display_name: `Agent ${shortAddr(address)}`,
    bio: `This address has no on-chain activity yet on Kite ${network === "testnet" ? "Testnet" : "Mainnet"}.`,
    avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
    is_contract: false,
    contract_name: null,
    kite_balance: "0.0000",
    kite_balance_wei: 0n,
    token_count: 0,
    tier: "untrusted",
    score: 0,
    is_kpass_verified: false,
    socials: { ens: null, farcaster: null, x: null },
    stats: { total_transactions: 0, token_transfers: 0, services_used: 0, products_bought: 0 },
    first_seen: null,
    network,
    fetched_at: new Date().toISOString(),
    has_onchain_history: false,
    is_live_data: true,
  };
}

export async function fetchProfile(
  input: string,
  network: KiteNetwork = "mainnet"
): Promise<ProfileResult> {
  const cleaned = input.trim();

  if (!isValidAddress(cleaned)) {
    if (cleaned.endsWith(".kite") || cleaned.endsWith(".eth")) {
      return {
        is_live_data: false,
        error: "not_found",
        message: `ENS resolution for "${cleaned}" is not supported on Kite yet.`,
        network,
      };
    }
    return {
      is_live_data: false,
      error: "invalid_address",
      message: "Address must be 0x followed by 40 hex characters.",
      network,
    };
  }

  const address = cleaned.toLowerCase() as Address;

  try {
    const [addrInfo, counters, tokens] = await Promise.all([
      getAddress(address, network),
      getAddressCounters(address, network).catch(() => ({
        transactions_count: "0",
        token_transfers_count: "0",
        gas_usage_count: "0",
        validations_count: "0",
      })),
      getAddressTokens(address, network).catch(() => []),
    ]);

    const txCount = parseInt(counters.transactions_count, 10) || 0;
    const tokenTransfers = parseInt(counters.token_transfers_count, 10) || 0;

    // Treat as empty when nothing on Blockscout points to real activity for this address.
    const hasHistory =
      txCount > 0 ||
      tokenTransfers > 0 ||
      addrInfo.has_token_transfers ||
      addrInfo.has_tokens ||
      addrInfo.is_contract ||
      !!addrInfo.name ||
      !!addrInfo.ens_domain_name ||
      (addrInfo.coin_balance !== null && addrInfo.coin_balance !== "0");

    if (!hasHistory) {
      return emptyProfile(address, network);
    }

    const balanceWei = BigInt(addrInfo.coin_balance ?? "0");
    const { tier, score } = mockTierFromActivity(txCount);

    const baseName =
      addrInfo.ens_domain_name ||
      addrInfo.name ||
      (addrInfo.is_contract ? "Smart Contract" : `Agent ${shortAddr(address)}`);

    const bio = addrInfo.is_contract
      ? `Smart contract on Kite ${network === "testnet" ? "Testnet" : "Mainnet"}${addrInfo.is_verified ? " (verified source)" : ""}.`
      : "Kite address — profile customization coming when AgentID backend ships.";

    return {
      address,
      display_name: baseName,
      bio,
      avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,

      is_contract: addrInfo.is_contract,
      contract_name: addrInfo.is_contract ? addrInfo.name : null,
      kite_balance: formatKite(balanceWei),
      kite_balance_wei: balanceWei,
      token_count: tokens.length,

      tier,
      score: Math.round(score),
      is_kpass_verified: false,

      socials: {
        ens: addrInfo.ens_domain_name,
        farcaster: null,
        x: null,
      },

      stats: {
        total_transactions: txCount,
        token_transfers: tokenTransfers,
        services_used: 0,
        products_bought: 0,
      },

      first_seen: null,
      network,
      fetched_at: new Date().toISOString(),
      has_onchain_history: true,
      is_live_data: true,
    };
  } catch (e) {
    if (e instanceof KiteScanError && e.status === 404) {
      return emptyProfile(address, network);
    }
    const message = e instanceof Error ? e.message : "Failed to reach KiteScan.";
    return {
      is_live_data: false,
      error: "network_error",
      message,
      network,
    };
  }
}
