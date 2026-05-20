export interface AgentProfile {
  address: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  tier: "untrusted" | "rookie" | "verified" | "trusted" | "elite";
  score: number;
  first_seen: string;
  is_kpass_verified: boolean;
  socials: {
    ens: string | null;
    farcaster: string | null;
    x: string | null;
  };
  stats: {
    total_transactions: number;
    usdc_volume_30d: number;
    services_used: number;
    products_bought: number;
  };
}

export const MOCK_PROFILE: AgentProfile = {
  address: "0xc82C2ADE9BbacF01C2168756Ce66E88F69676967",
  display_name: "Atlas Research Agent",
  bio: "Autonomous research agent. Pays for academic API access via Conduit-Kite. Owned by @gnanam.",
  avatar_url: "https://api.dicebear.com/7.x/identicon/svg?seed=0xc82C2ADE9BbacF01C2168756Ce66E88F69676967",
  tier: "trusted" as const,
  score: 742,
  first_seen: "2026-01-15T08:22:00Z",
  is_kpass_verified: true,
  socials: {
    ens: "atlas.kite",
    farcaster: "@atlas-agent",
    x: null,
  },
  stats: {
    total_transactions: 1247,
    usdc_volume_30d: 432.18,
    services_used: 14,
    products_bought: 3,
  },
};

export const MOCK_OTHER_PROFILES: Record<string, AgentProfile> = {
  "0xc82C2ADE9BbacF01C2168756Ce66E88F69676967": MOCK_PROFILE,
  "0xab12de34cd56ef78ab12cd3456ef78ab12cd3456": {
    address: "0xab12de34cd56ef78ab12cd3456ef78ab12cd3456",
    display_name: "DataPilot",
    bio: "Decentralized machine learning and market data routing intelligence. Streams high-fidelity price models on-chain. Built on Kite SDK.",
    avatar_url: "https://api.dicebear.com/7.x/identicon/svg?seed=0xab12de34cd56ef78ab12cd3456ef78ab12cd3456",
    tier: "elite" as const,
    score: 921,
    first_seen: "2025-11-20T12:05:00Z",
    is_kpass_verified: true,
    socials: {
      ens: "datapilot.kite",
      farcaster: "@datapilot",
      x: "@DataPilotOnKite",
    },
    stats: {
      total_transactions: 8521,
      usdc_volume_30d: 3840.50,
      services_used: 32,
      products_bought: 12,
    },
  },
  "0x999912344444bcbc999912344444bcbc99991234": {
    address: "0x999912344444bcbc999912344444bcbc99991234",
    display_name: "MarketWatcher",
    bio: "Sentiment monitor looking at developer feeds and liquid staking channels. Auto-publishes weekly trust rankings on Kite validators.",
    avatar_url: "https://api.dicebear.com/7.x/identicon/svg?seed=0x999912344444bcbc999912344444bcbc99991234",
    tier: "verified" as const,
    score: 612,
    first_seen: "2026-02-10T15:30:00Z",
    is_kpass_verified: false,
    socials: {
      ens: "marketwatcher.kite",
      farcaster: "@mktwatcher",
      x: null,
    },
    stats: {
      total_transactions: 412,
      usdc_volume_30d: 89.20,
      services_used: 5,
      products_bought: 1,
    },
  },
  "0x8888aabb3333ccdd8888aabb3333ccdd8888aabb": {
    address: "0x8888aabb3333ccdd8888aabb3333ccdd8888aabb",
    display_name: "Newsroom Bot",
    bio: "Generates semantic synthesis of global crypto regulation news. Subscribes to premium content relays on ShopKite.",
    avatar_url: "https://api.dicebear.com/7.x/identicon/svg?seed=0x8888aabb3333ccdd8888aabb3333ccdd8888aabb",
    tier: "trusted" as const,
    score: 781,
    first_seen: "2026-01-02T09:00:00Z",
    is_kpass_verified: true,
    socials: {
      ens: "newsroom.kite",
      farcaster: "@newsroom",
      x: "@KiteNewsroom",
    },
    stats: {
      total_transactions: 1450,
      usdc_volume_30d: 712.45,
      services_used: 8,
      products_bought: 6,
    },
  }
};

export const MOCK_ACTIVITY = [
  { id: "1", type: "service_call", description: "Called GPT-4o Summary Service", amount_usdc: 0.002, timestamp: "2026-05-20T08:42:00Z", tx_hash: "0x3ab8...f240" },
  { id: "2", type: "transfer_out", description: "Sent USDC.e", recipient: "0xdef...123", amount_usdc: 5.0, timestamp: "2026-05-20T07:15:00Z", tx_hash: "0xcd51...88ab" },
  { id: "3", type: "service_call", description: "Called Polymarket Odds API", amount_usdc: 0.001, timestamp: "2026-05-20T06:33:00Z", tx_hash: "0xa129...ce33" },
  { id: "4", type: "product_purchase", description: "Bought Python Tutorial Bundle", amount_usdc: 1.5, timestamp: "2026-05-19T22:10:00Z", tx_hash: "0x98f2...14ba" },
  { id: "5", type: "stake", description: "Delegated 100 KITE to validator", amount_kite: 100, timestamp: "2026-05-19T14:00:00Z", tx_hash: "0xbf21...5568" },
];

export const MOCK_SCORE_FACTORS = [
  { name: "Account age", percent: 78, raw: "125 days" },
  { name: "Transaction volume", percent: 82, raw: "$432.18 (30d)" },
  { name: "kpass verification", percent: 100, raw: "Active session" },
  { name: "Payment reliability", percent: 96, raw: "96% success rate" },
  { name: "Counterparty diversity", percent: 64, raw: "23 unique" },
  { name: "Governance", percent: 45, raw: "100 KITE staked" },
];

export const MOCK_FEATURED_AGENTS = [
  { address: "0xc82C2ADE9BbacF01C2168756Ce66E88F69676967", name: "Atlas Research", tier: "trusted", score: 742, avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=0xc82C2ADE9BbacF01C2168756Ce66E88F69676967" },
  { address: "0xab12de34cd56ef78ab12cd3456ef78ab12cd3456", name: "DataPilot", tier: "elite", score: 921, avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=0xab12de34cd56ef78ab12cd3456ef78ab12cd3456" },
  { address: "0x999912344444bcbc999912344444bcbc99991234", name: "MarketWatcher", tier: "verified", score: 612, avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=0x999912344444bcbc999912344444bcbc99991234" },
  { address: "0x8888aabb3333ccdd8888aabb3333ccdd8888aabb", name: "Newsroom Bot", tier: "trusted", score: 781, avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=0x8888aabb3333ccdd8888aabb3333ccdd8888aabb" },
];

export const MOCK_SERVICES = [
  { id: "s1", name: "Conduit LLM Hub", provider: "Conduit-Kite", type: "Inference", calls: 842, lastUsed: "2h ago", cost: "$0.0015/call" },
  { id: "s2", name: "Polymarket Realtime Odds", provider: "Polymarket API", type: "Oracle", calls: 321, lastUsed: "6h ago", cost: "$0.001/call" },
  { id: "s3", name: "Socrates Proof Generator", provider: "Socrates Lab", type: "Coprocessor", calls: 64, lastUsed: "1d ago", cost: "$0.05/proof" },
  { id: "s4", name: "Whisper Audio Transcriber", provider: "Conduit-Kite", type: "Inference", calls: 20, lastUsed: "3d ago", cost: "$0.002/min" },
];

export const MOCK_PURCHASES = [
  { id: "p1", name: "Kite Developer License Key", store: "ShopKite SDKs", date: "2026-05-18", price: 10.00, status: "Fulfilled" },
  { id: "p2", name: "Python Tutorial Bundle (Expert Tier)", store: "ShopKite Guides", date: "2026-05-19", price: 1.50, status: "Delivered" },
  { id: "p3", name: "Kite Node Validator Ticket #412", store: "ShopKite Tickets", date: "2026-04-10", price: 50.00, status: "Active" },
];

// Helper to resolve an address/ENS or dynamically generate if arbitrary
export function getProfileForAddress(searchVal: string): AgentProfile {
  const norm = searchVal.trim().toLowerCase();
  
  // Look up by address match
  for (const [addr, prof] of Object.entries(MOCK_OTHER_PROFILES)) {
    if (addr.toLowerCase() === norm) {
      return prof;
    }
  }

  // Look up by ENS name match
  for (const prof of Object.values(MOCK_OTHER_PROFILES)) {
    if (prof.socials.ens && prof.socials.ens.toLowerCase() === norm) {
      return prof;
    }
  }

  // Generate deterministic mock profile for any valid format
  const isEns = norm.endsWith(".kite") || norm.endsWith(".eth") || !norm.startsWith("0x");
  const address = isEns 
    ? "0x" + Array.from(norm).map(c => c.charCodeAt(0).toString(16)).join("").substring(0, 40).padEnd(40, "d")
    : searchVal;

  // Let's seed score based on length or value
  const seedNum = Array.from(norm).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const score = 300 + (seedNum % 600);
  let tier: "untrusted" | "rookie" | "verified" | "trusted" | "elite" = "rookie";
  if (score > 850) tier = "elite";
  else if (score > 700) tier = "trusted";
  else if (score > 500) tier = "verified";
  else if (score < 400) tier = "untrusted";

  const display_name = isEns 
    ? norm.charAt(0).toUpperCase() + norm.slice(1, -5) + " Agent"
    : `Agent 0x${searchVal.substring(2, 6).toUpperCase()}...${searchVal.substring(searchVal.length - 4).toUpperCase()}`;

  const bio = isEns
    ? `Autonomous protocol operator registered via ${searchVal}. Conducts low-latency execution and service settlement inside the Kite Ecosystem.`
    : `Public autonomous agent acting at Kite block-address ${searchVal}. Actively settling microtransactions and computing task signatures.`;

  return {
    address,
    display_name,
    bio,
    avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
    tier,
    score,
    first_seen: new Date(Date.now() - (seedNum % 200) * 86400000).toISOString(),
    is_kpass_verified: score > 600,
    socials: {
      ens: isEns ? searchVal : `agent_${seedNum % 999}.kite`,
      farcaster: `@agent-${seedNum % 999}`,
      x: seedNum % 2 === 0 ? `@agent_x_${seedNum % 999}` : null,
    },
    stats: {
      total_transactions: Math.floor(score * 1.5 + (seedNum % 30)),
      usdc_volume_30d: Number((score * 0.58 + (seedNum % 100)).toFixed(2)),
      services_used: Math.floor(score / 100) + 1,
      products_bought: Math.max(1, seedNum % 6),
    }
  };
}
