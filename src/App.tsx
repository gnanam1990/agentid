import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  User,
  Activity,
  Shield,
  Search,
  Check,
  ExternalLink,
  Lock,
  Settings,
  X,
  Plus,
  Compass,
  ArrowRight,
  TrendingUp,
  Award,
  DollarSign,
  Briefcase,
  Layers,
  Sparkles,
  Zap,
  HelpCircle,
  FileText,
  AlertTriangle,
  Sprout,
  FlaskConical,
  Wifi,
  WifiOff
} from "lucide-react";

import {
  MOCK_SCORE_FACTORS,
  MOCK_FEATURED_AGENTS,
  MOCK_SERVICES,
  MOCK_PURCHASES,
  MOCK_OTHER_PROFILES,
  getProfileForAddress
} from "./lib/mock-data";
import { fetchProfile, type LiveAgentProfile, type ProfileResult } from "./lib/profile";
import { fetchActivity, type LiveActivityItem } from "./lib/activity";
import { cached } from "./lib/cache";
import { explorerAddressUrl, isValidAddress, type KiteNetwork } from "./lib/kite-chain";

import { SiteHeader } from "./components/site-header";
import { SiteFooter } from "./components/site-footer";
import { ProfileHero } from "./components/profile-hero";
import { StatCard } from "./components/stat-card";
import { ActivityFeedItem } from "./components/activity-feed-item";

const NETWORK_STORAGE_KEY = "agentid:network";

function readInitialNetwork(): KiteNetwork {
  if (typeof window === "undefined") return "mainnet";
  const stored = window.localStorage.getItem(NETWORK_STORAGE_KEY);
  return stored === "testnet" ? "testnet" : "mainnet";
}

function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("demo") === "true";
}

function fetchProfileCached(address: string, network: KiteNetwork): Promise<ProfileResult> {
  return cached(`profile:${network}:${address.toLowerCase()}`, 60_000, () =>
    fetchProfile(address, network)
  );
}

function fetchActivityCached(address: string, network: KiteNetwork): Promise<LiveActivityItem[]> {
  return cached(`activity:${network}:${address.toLowerCase()}`, 60_000, () =>
    fetchActivity(address, network)
  );
}

function relativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "recently";
  const diffMs = Date.now() - date.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function makeSparkline(target: number): number[] {
  if (!Number.isFinite(target) || target <= 0) return [0, 0, 0, 0, 0, 0, 0];
  const steps = 7;
  const out: number[] = [];
  for (let i = 0; i < steps; i++) {
    const t = (i + 1) / steps;
    out.push(target * (0.55 + 0.45 * t));
  }
  return out;
}

function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      <div className="w-full bg-kite-card border border-kite-border rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start gap-6">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg bg-kite-muted animate-pulse" />
          <div className="flex-1 space-y-3 w-full">
            <div className="h-8 w-2/3 bg-kite-muted rounded animate-pulse" />
            <div className="h-3 w-1/3 bg-kite-muted rounded animate-pulse" />
            <div className="h-3 w-full bg-kite-muted rounded animate-pulse" />
            <div className="h-3 w-3/4 bg-kite-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-lg bg-kite-card/30 border border-kite-border/60 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

type Route = { name: "home" | "profile" | "edit"; address?: string };

function routeFromLocation(): Route {
  if (typeof window === "undefined") return { name: "home" };
  const path = window.location.pathname;
  const m = path.match(/^\/(0x[a-fA-F0-9]{40})(?:\/edit)?\/?$/);
  if (m) {
    if (path.endsWith("/edit")) return { name: "edit", address: m[1] };
    return { name: "profile", address: m[1] };
  }
  return { name: "home" };
}

function pathFromRoute(route: Route): string {
  if (route.name === "home") return "/";
  if (route.name === "edit" && route.address) return `/${route.address}/edit`;
  if (route.address) return `/${route.address}`;
  return "/";
}

export default function App() {
  // Routing State — derived from window.location.pathname
  const [currentRoute, setCurrentRoute] = useState<Route>(() => routeFromLocation());

  // Browser back/forward navigation
  useEffect(() => {
    const onPop = () => setCurrentRoute(routeFromLocation());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Keep URL in sync with route changes (for deep linking + sharing)
  useEffect(() => {
    const target = pathFromRoute(currentRoute);
    if (window.location.pathname !== target) {
      window.history.pushState({}, "", target + window.location.search);
    }
  }, [currentRoute.name, currentRoute.address]);

  // Network selector (mainnet | testnet), persisted in localStorage
  const [network, setNetwork] = useState<KiteNetwork>(() => readInitialNetwork());
  const demoMode = useMemo(() => isDemoMode(), []);

  // Live fetched data for the currently-viewed profile
  const [profileResult, setProfileResult] = useState<ProfileResult | null>(null);
  const [activityItems, setActivityItems] = useState<LiveActivityItem[] | null>(null);

  // Overlay of locally-saved display name / bio / socials (per-address, per-network)
  // Lets the (cosmetic) Edit screen "save" changes for the session without mutating chain data.
  const [profileOverlays, setProfileOverlays] = useState<Record<string, Partial<LiveAgentProfile>>>({});

  // Global Session State
  const [kpassConnected, setKpassConnected] = useState(true);

  // Tipping Modal State (cosmetic only in v0.1 — no real wallet wired)
  const [tippingAddress, setTippingAddress] = useState<string | null>(null);
  const [customTipAmount, setCustomTipAmount] = useState("5.00");

  // Search Input State
  const [homeSearchInput, setHomeSearchInput] = useState("");

  // Profile Page Tab state
  const [activeTab, setActiveTab] = useState<"activity" | "services" | "purchases" | "score">("activity");

  // Edit Page Form State
  const [editForm, setEditForm] = useState({
    display_name: "",
    bio: "",
    ens: "",
    farcaster: "",
    x: ""
  });
  const [editError, setEditError] = useState("");

  // Notification Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);

  // Persist network choice
  useEffect(() => {
    try {
      window.localStorage.setItem(NETWORK_STORAGE_KEY, network);
    } catch {
      /* localStorage unavailable */
    }
  }, [network]);

  const overlayKey = (addr: string, net: KiteNetwork) => `${net}:${addr.toLowerCase()}`;

  // Fetch profile + activity whenever the route address or network changes
  useEffect(() => {
    const needsFetch =
      (currentRoute.name === "profile" || currentRoute.name === "edit") &&
      !!currentRoute.address;
    if (!needsFetch) {
      setProfileResult(null);
      setActivityItems(null);
      return;
    }
    const addr = currentRoute.address!;
    let cancelled = false;

    setProfileResult(null);
    setActivityItems(null);

    if (demoMode && isValidAddress(addr)) {
      const isKnownDemoAddress = Object.keys(MOCK_OTHER_PROFILES).some(
        (demoAddress) => demoAddress.toLowerCase() === addr.toLowerCase()
      );

      if (isKnownDemoAddress) {
        const mock = getProfileForAddress(addr);
        const synthetic: LiveAgentProfile = {
          address: mock.address,
          display_name: mock.display_name,
          bio: mock.bio,
          avatar_url: mock.avatar_url,
          is_contract: false,
          contract_name: null,
          kite_balance: "0.0000",
          kite_balance_wei: 0n,
          token_count: 0,
          tier: mock.tier,
          score: mock.score,
          is_kpass_verified: mock.is_kpass_verified,
          socials: mock.socials,
          stats: {
            total_transactions: mock.stats.total_transactions,
            token_transfers: 0,
            services_used: mock.stats.services_used,
            products_bought: mock.stats.products_bought
          },
          first_seen: mock.first_seen,
          network,
          fetched_at: new Date().toISOString(),
          has_onchain_history: true,
          is_live_data: true,
          is_demo: true
        };
        setProfileResult(synthetic);
        setActivityItems([]);
        return;
      }
    }

    fetchProfileCached(addr, network).then((p) => {
      if (!cancelled) setProfileResult(p);
    });
    if (isValidAddress(addr)) {
      fetchActivityCached(addr, network)
        .then((a) => {
          if (!cancelled) setActivityItems(a);
        })
        .catch(() => {
          if (!cancelled) setActivityItems([]);
        });
    } else {
      setActivityItems([]);
    }

    return () => {
      cancelled = true;
    };
  }, [currentRoute.name, currentRoute.address, network, demoMode]);

  // Merged profile: live data + local overlay (cosmetic edits)
  const activeProfile: LiveAgentProfile | null = useMemo(() => {
    if (!profileResult || profileResult.is_live_data === false) return null;
    const overlay = profileOverlays[overlayKey(profileResult.address, network)];
    if (!overlay) return profileResult;
    return {
      ...profileResult,
      ...overlay,
      socials: { ...profileResult.socials, ...(overlay.socials ?? {}) }
    };
  }, [profileResult, profileOverlays, network]);

  const showToast = (message: string, type: "success" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Switch pages smoothly
  const handleNavigate = useCallback(
    (page: "home" | "profile" | "edit", address?: string) => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (page === "profile" && address) {
        setCurrentRoute({ name: "profile", address: address.trim() });
        setActiveTab("activity");
      } else if (page === "edit") {
        const activeAddr = currentRoute.address || "";
        if (activeProfile) {
          setEditForm({
            display_name: activeProfile.display_name,
            bio: activeProfile.bio,
            ens: activeProfile.socials.ens || "",
            farcaster: activeProfile.socials.farcaster || "",
            x: activeProfile.socials.x || ""
          });
        }
        setEditError("");
        setCurrentRoute({ name: "edit", address: activeAddr });
      } else {
        setCurrentRoute({ name: "home" });
      }
    },
    [activeProfile, currentRoute.address]
  );

  // Perform search — fetchProfile validates inputs and returns ProfileError for bad ones.
  const handleSearchAction = (query: string) => {
    const cleanQuery = query.trim();
    if (!cleanQuery) return;
    handleNavigate("profile", cleanQuery);
  };

  // Tipping in v0.1 is read-only — show an explanatory toast instead of mutating live data.
  const closeTipDialog = () => {
    setTippingAddress(null);
    setCustomTipAmount("5.00");
  };
  const processTipping = (amount: number) => {
    if (!tippingAddress || isNaN(amount) || amount <= 0) return;
    showToast(
      `Tipping is preview-only in AgentID v0.1 — no wallet connected. (Would have sent $${amount.toFixed(2)})`,
      "info"
    );
    closeTipDialog();
  };

  // "Save" — applies a local cosmetic overlay; nothing is written on-chain or to a backend.
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.display_name.trim()) {
      setEditError("Display name is required");
      return;
    }
    if (!activeProfile) return;
    const key = overlayKey(activeProfile.address, network);
    setProfileOverlays(prev => ({
      ...prev,
      [key]: {
        display_name: editForm.display_name.trim(),
        bio: editForm.bio.trim(),
        socials: {
          ens: editForm.ens.trim() || null,
          farcaster: editForm.farcaster.trim() || null,
          x: editForm.x.trim() || null
        }
      }
    }));
    showToast("Display details saved locally for this session.");
    handleNavigate("profile", activeProfile.address);
  };

  return (
    <div className="min-h-screen bg-kite-bg text-kite-fg flex flex-col font-sans selection:bg-kite-primary/20 selection:text-kite-fg">
      
      {/* Dynamic site header */}
      <SiteHeader
        onSearch={handleSearchAction}
        onNavigate={handleNavigate}
        kpassConnected={kpassConnected}
        onToggleKpass={() => {
          const nextState = !kpassConnected;
          setKpassConnected(nextState);
          showToast(
            nextState
              ? "kpass wallet connected! Identity delegation active."
              : "kpass disconnected. Switched to Guest View.",
            "info"
          );
        }}
        network={network}
        onToggleNetwork={() => {
          const next: KiteNetwork = network === "mainnet" ? "testnet" : "mainnet";
          setNetwork(next);
          showToast(
            `Switched to Kite ${next === "mainnet" ? "Mainnet" : "Testnet"}.`,
            "info"
          );
        }}
      />

      {/* Main Content Viewport */}
      <main className="flex-grow pt-6 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Notification Toast */}
          {toast && (
            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-kite-card border border-kite-primary px-4 py-3 rounded-lg shadow-lg max-w-sm animate-fade-in">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-kite-accent text-white">
                <Check className="w-3.5 h-3.5" />
              </span>
              <div>
                <p className="text-xs font-semibold text-kite-fg">{toast.message}</p>
              </div>
            </div>
          )}

          {/* SCREEN 1: LANDING/HOME VIEW */}
          {currentRoute.name === "home" && (
            <div className="space-y-16 py-8">
              {/* Classical Kite Brand Hero Section */}
              <div className="relative text-center py-16 px-4 rounded-2xl kite-gradient border border-kite-border overflow-hidden shadow-xs">
                <div className="absolute top-0 right-0 w-32 h-32 bg-kite-primary/5 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-kite-accent/5 rounded-full blur-3xl"></div>

                <div className="max-w-3xl mx-auto space-y-6">
                  {/* Decorative Anchor */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold bg-kite-primary/10 border border-kite-primary/30 text-kite-primary text-center">
                    <Sparkles className="w-3 h-3 text-kite-primary" /> Kite Blockchain Passport Identity
                  </span>

                  <h1 className="font-instrument text-5xl sm:text-7xl font-normal leading-tight text-kite-fg tracking-tight">
                    Every agent. <span className="italic">One profile.</span>
                  </h1>

                  <p className="text-base sm:text-lg text-kite-fg/75 max-w-xl mx-auto leading-relaxed">
                    AgentID gives every Kite on-chain address a beautiful public face. Look up credentials, audit real-time execution reputation, and process smart tips instantly.
                  </p>

                  {/* Search Form */}
                  <div className="max-w-lg mx-auto pt-4">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (homeSearchInput.trim()) {
                          handleSearchAction(homeSearchInput);
                        }
                      }}
                      className="flex flex-col sm:flex-row gap-2"
                    >
                      <div className="relative flex-1">
                        <label htmlFor="home-search" className="sr-only">Look up a Kite address or ENS</label>
                        <input
                          id="home-search"
                          type="text"
                          placeholder="Look up an address or ENS (e.g., atlas.kite)..."
                          value={homeSearchInput}
                          onChange={(e) => setHomeSearchInput(e.target.value)}
                          className="w-full bg-kite-bg border border-kite-border focus:border-kite-primary focus:outline-none rounded-md px-4 py-2.5 pl-10 text-sm text-kite-fg placeholder-kite-fg/40 shadow-inner"
                        />
                        <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-kite-fg/30" />
                      </div>
                      <button
                        type="submit"
                        className="bg-kite-primary text-white hover:bg-kite-primary/90 px-6 py-2.5 rounded-md text-sm font-semibold tracking-wide transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                      >
                        <span>Browse Agent</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>

                    {/* Quick presets — real Kite Mainnet addresses with live activity */}
                    <div className="mt-3.5 flex flex-wrap justify-center items-center gap-2.5 text-xs text-kite-fg/60">
                      <span className="font-medium">Or try a live address:</span>
                      <button
                        onClick={() => handleSearchAction("0xe1844c5D63a9543023008D332Bd3d2e6f1FE1043")}
                        className="px-2.5 py-1 rounded border border-kite-border/60 hover:bg-kite-card font-mono text-[11px] font-medium text-kite-fg/80 transition-colors"
                        title="LayerZero ReceiveUln302 contract on Kite Mainnet"
                      >
                        0xe184…1043
                      </button>
                      <button
                        onClick={() => handleSearchAction("0x6F475642a6e85809B1c36Fa62763669b1b48DD5B")}
                        className="px-2.5 py-1 rounded border border-kite-border/60 hover:bg-kite-card font-mono text-[11px] font-medium text-kite-fg/80 transition-colors"
                        title="LayerZero EndpointV2 contract on Kite Mainnet"
                      >
                        0x6F47…DD5B
                      </button>
                    </div>
                    <div className="mt-3 text-center">
                      <a
                        href="/0xc82C2ADE9BbacF01C2168756Ce66E88F69676967?demo=true"
                        className="text-xs text-kite-fg/55 underline underline-offset-4 hover:text-kite-fg transition-colors"
                      >
                        See a demo profile →
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Three Column "Why AgentID" Value Proposition */}
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="font-instrument text-4xl text-kite-fg">Engineered for Autonomous Trust</h2>
                  <p className="text-sm text-kite-fg/60 max-w-md mx-auto">Providing a unified layer to interact with, secure, and fund autonomous entities.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1: Identity */}
                  <div className="p-6 bg-kite-card/30 border border-kite-border/60 rounded-xl space-y-3.5 hover:border-kite-border transition-colors">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-kite-primary/10 border border-kite-primary/20 text-kite-primary">
                      <User className="w-5 h-5" />
                    </div>
                    <h3 className="font-sans text-lg font-bold text-kite-fg">Human-Readable Identity</h3>
                    <p className="text-sm text-kite-fg/75 leading-relaxed">
                      Erase opaque hex addresses. Attach customizable display names, descriptions, metadata, avatars, and linked socials (ENS, Farcaster, X) securely.
                    </p>
                  </div>

                  {/* Card 2: Live Onchain activity */}
                  <div className="p-6 bg-kite-card/30 border border-kite-border/60 rounded-xl space-y-3.5 hover:border-kite-border transition-colors">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-kite-accent/10 border border-kite-accent/20 text-kite-accent">
                      <Activity className="w-5 h-5" />
                    </div>
                    <h3 className="font-sans text-lg font-bold text-kite-fg">Real-Time Pulse</h3>
                    <p className="text-sm text-kite-fg/75 leading-relaxed">
                      Track services consumed on Conduit, products bought on ShopKite, dynamic rolling metric charts, and validator delegation states in real-time.
                    </p>
                  </div>

                  {/* Card 3: Security & Reputation */}
                  <div className="p-6 bg-kite-card/30 border border-kite-border/60 rounded-xl space-y-3.5 hover:border-kite-border transition-colors">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400">
                      <Shield className="w-5 h-5" />
                    </div>
                    <h3 className="font-sans text-lg font-bold text-kite-fg">kpass Delegation</h3>
                    <p className="text-sm text-kite-fg/75 leading-relaxed">
                      Leverage Kite’s native session-based delegation keys. Display reputation scores based on transaction fidelity, safety quotients, and network age.
                    </p>
                  </div>
                </div>
              </div>

              {/* Featured Agents List */}
              {/*
                Featured agents remain mock data: KiteScan exposes no public
                "list of notable addresses" endpoint, so we curate a sample here.
                Replace with a real backend feed once AgentID services ship.
              */}
              <div id="featured-agents-section" className="space-y-6">
                <div className="flex items-center justify-between border-b border-kite-border pb-3">
                  <div className="space-y-1">
                    <h3 className="font-instrument text-3xl font-normal text-kite-fg flex items-center gap-2">
                      Sample Agents
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-kite-fg/50 bg-kite-muted border border-kite-border/60 px-1.5 py-0.5 rounded">
                        <Sprout className="w-3 h-3" /> Curated
                      </span>
                    </h3>
                    <p className="text-xs text-kite-fg/50">Hand-picked Kite addresses — real on-chain stats load when you open one.</p>
                  </div>
                  <span className="text-xs font-semibold text-kite-primary tracking-wide flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5" /> Examples
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {MOCK_FEATURED_AGENTS.map((agent) => (
                    <div
                      key={agent.address}
                      onClick={() => handleNavigate("profile", agent.address)}
                      className="p-5 bg-kite-card/50 border border-kite-border rounded-lg hover:border-kite-primary hover:bg-kite-card pointer cursor-pointer transition-all duration-200 group flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={agent.avatar}
                            alt={agent.name}
                            referrerPolicy="no-referrer"
                            className="w-11 h-11 rounded-md border border-kite-border bg-kite-muted"
                          />
                          <div className="min-w-0">
                            <h4 className="font-sans text-sm font-bold text-kite-fg truncate group-hover:text-kite-primary transition-colors">
                              {agent.name}
                            </h4>
                            <p className="font-mono text-[10px] text-kite-fg/50">
                              {agent.address.substring(0, 6)}...{agent.address.substring(agent.address.length - 4)}
                            </p>
                          </div>
                        </div>

                        <div className="pt-1.5 flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-kite-fg/40">Sample tier:</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${agent.tier === "elite" ? "bg-kite-accent animate-pulse" : "bg-kite-primary"}`} />
                          <span className="text-[10px] font-semibold text-kite-fg/60 uppercase tracking-widest">{agent.tier}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-kite-border/40 flex items-center justify-between text-xs font-medium text-kite-fg/60">
                        <span>Open live profile</span>
                        <span className="text-kite-primary group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* SCREEN 2:/[address] — PUBLIC PROFILE VIEW */}
          {currentRoute.name === "profile" && (
            <div className="space-y-8 animate-fade-in py-4">

              {/* Profile Back Button / Breadcrumb */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <button
                  onClick={() => handleNavigate("home")}
                  className="flex items-center gap-1.5 text-xs font-semibold text-kite-primary hover:text-kite-fg transition-colors duration-150"
                >
                  <span>Home</span>
                  <span className="text-kite-fg/30">/</span>
                  <span className="text-kite-fg/60">Live KiteScan Lookup</span>
                </button>

                {/* Network ribbon */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 text-kite-fg/60 font-medium px-2 py-1 rounded bg-kite-muted border border-kite-border/40">
                    <Wifi className="w-3.5 h-3.5" /> Kite {network === "mainnet" ? "Mainnet" : "Testnet"} • Chain {network === "mainnet" ? "2366" : "2368"}
                  </span>
                </div>
              </div>

              {/* Loading state */}
              {profileResult === null && <ProfileSkeleton />}

              {/* Error state */}
              {profileResult && profileResult.is_live_data === false && (
                <div className="bg-kite-card border border-kite-destructive/40 rounded-xl p-6 sm:p-8 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-md bg-kite-destructive/10 text-kite-destructive border border-kite-destructive/20">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <h2 className="font-instrument text-3xl text-kite-fg">
                        {profileResult.error === "invalid_address"
                          ? "That doesn't look like a Kite address"
                          : profileResult.error === "not_found"
                          ? "We couldn't resolve that name"
                          : "KiteScan is unreachable right now"}
                      </h2>
                      <p className="text-sm text-kite-fg/75 leading-relaxed">{profileResult.message}</p>
                      <div className="pt-2 flex flex-wrap gap-2 text-xs">
                        <button
                          onClick={() => handleNavigate("home")}
                          className="px-3 py-1.5 rounded-md bg-kite-primary text-white font-semibold hover:bg-kite-primary/90"
                        >
                          Back to home
                        </button>
                        {profileResult.error === "network_error" && currentRoute.address && (
                          <button
                            onClick={() => handleNavigate("profile", currentRoute.address!)}
                            className="px-3 py-1.5 rounded-md border border-kite-border text-kite-fg font-semibold hover:bg-kite-muted"
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Loaded profile */}
              {activeProfile && (
                <>
                  {activeProfile.is_demo && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 mb-4 flex items-center gap-2 text-sm text-amber-950 dark:text-amber-100">
                      <FlaskConical className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      <span>
                        <strong>Demo mode.</strong> This profile is synthetic mock data for screenshots and previews. Remove{" "}
                        <code className="font-mono text-xs bg-amber-100 dark:bg-amber-900/40 px-1 rounded">
                          ?demo=true
                        </code>{" "}
                        from the URL to load real on-chain data from KiteScan.
                      </span>
                    </div>
                  )}

                  <ProfileHero
                    profile={activeProfile}
                    isOwner={kpassConnected}
                    onEdit={() => handleNavigate("edit")}
                    onTipClick={() => {
                      setTippingAddress(activeProfile.address);
                      setCustomTipAmount("5.00");
                    }}
                  />

                  {/* Freshness footer */}
                  <div className="flex items-center justify-between text-[11px] text-kite-fg/55 -mt-4 px-1">
                    {activeProfile.is_demo ? (
                      <span className="inline-flex items-center gap-1.5">
                        <FlaskConical className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>Demo data — synthetic profile</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <Wifi className="w-3 h-3 text-kite-accent" />
                        <span className="font-medium">Live from KiteScan</span>
                        <span className="opacity-50">•</span>
                        <span>Updated {relativeTime(activeProfile.fetched_at)}</span>
                      </span>
                    )}
                    {activeProfile.is_contract && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-kite-primary/10 text-kite-primary font-semibold uppercase tracking-wider">
                        Smart contract{activeProfile.contract_name ? ` • ${activeProfile.contract_name}` : ""}
                      </span>
                    )}
                  </div>

                  {/* Core metrics row — counts from chain */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      label="Total Transactions"
                      value={activeProfile.stats.total_transactions.toLocaleString()}
                      sparklineData={makeSparkline(activeProfile.stats.total_transactions)}
                      description="Lifetime, from KiteScan counters"
                    />
                    <StatCard
                      label={`${network === "testnet" ? "Testnet " : ""}KITE Balance`}
                      value={activeProfile.kite_balance}
                      sparklineData={makeSparkline(parseFloat(activeProfile.kite_balance))}
                      description={`Native KITE held by this address`}
                    />
                    <StatCard
                      label="Token Transfers"
                      value={activeProfile.stats.token_transfers.toLocaleString()}
                      sparklineData={makeSparkline(activeProfile.stats.token_transfers)}
                      description="ERC-20 / token transfer count"
                    />
                    <StatCard
                      label="Tokens Held"
                      value={activeProfile.token_count.toLocaleString()}
                      sparklineData={makeSparkline(activeProfile.token_count)}
                      description="Distinct token contracts with balance"
                    />
                  </div>

              {/* Tabs Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Left Tabs Interface: Takes 2 Columns */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Selector Header Classically Curved */}
                  <div className="flex border-b border-kite-border bg-kite-card/20 p-1 rounded-t-lg gap-2">
                    <button
                      onClick={() => setActiveTab("activity")}
                      className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all duration-150 flex items-center justify-center gap-1.5 ${
                        activeTab === "activity"
                          ? "bg-kite-card text-kite-fg shadow-xs border-b-2 border-kite-primary"
                          : "text-kite-fg/50 hover:text-kite-fg hover:bg-kite-muted/55"
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>Activity Logs</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("services")}
                      className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all duration-150 flex items-center justify-center gap-1.5 ${
                        activeTab === "services"
                          ? "bg-kite-card text-kite-fg shadow-xs border-b-2 border-kite-primary"
                          : "text-kite-fg/50 hover:text-kite-fg hover:bg-kite-muted/55"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Services consumed</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("purchases")}
                      className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all duration-150 flex items-center justify-center gap-1.5 ${
                        activeTab === "purchases"
                          ? "bg-kite-card text-kite-fg shadow-xs border-b-2 border-kite-primary"
                          : "text-kite-fg/50 hover:text-kite-fg hover:bg-kite-muted/55"
                      }`}
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Bought Items</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("score")}
                      className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all duration-150 flex items-center justify-center gap-1.5 ${
                        activeTab === "score"
                          ? "bg-kite-card text-kite-fg shadow-xs border-b-2 border-kite-primary"
                          : "text-kite-fg/50 hover:text-kite-fg hover:bg-kite-muted/55"
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Reputation Breakdown</span>
                    </button>
                  </div>

                  {/* Tab Contents */}
                  <div className="p-1">
                    
                    {/* Activity Feed tab */}
                    {activeTab === "activity" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs text-kite-fg/50 font-medium px-1">
                          <span>Latest on-chain transactions from KiteScan (Chain ID {network === "mainnet" ? "2366" : "2368"})</span>
                          <span>Cached 60s</span>
                        </div>

                        {activityItems === null ? (
                          <div className="space-y-2.5">
                            {[0, 1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className="h-16 rounded-lg bg-kite-card/30 border border-kite-border/40 animate-pulse"
                              />
                            ))}
                          </div>
                        ) : activityItems.length === 0 ? (
                          <div className="py-12 text-center bg-kite-card/20 rounded-xl border border-dashed border-kite-border/80">
                            <FileText className="w-10 h-10 text-kite-fg/30 mx-auto mb-3" />
                            <h4 className="font-semibold text-sm mb-1 text-kite-fg">No on-chain activity yet</h4>
                            <p className="text-xs text-kite-fg/50">This address has no transactions or token transfers on Kite {network === "mainnet" ? "Mainnet" : "Testnet"}.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {activityItems.map((act) => (
                              <ActivityFeedItem key={act.id} item={act} network={network} />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Services Concurrence Tab */}
                    {activeTab === "services" && (
                      <div className="space-y-4">
                        <div className="px-1 mb-2 flex items-start gap-2 text-xs text-kite-fg/70 bg-kite-muted/60 border border-kite-border/40 rounded p-2.5 leading-relaxed">
                          <Sprout className="w-3.5 h-3.5 mt-0.5 text-kite-primary flex-shrink-0" />
                          <span>
                            <strong>Sample data</strong> — Conduit-Kite microservice metering isn't live yet.
                            Real per-agent service usage will appear here once the AgentID backend ships.
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {MOCK_SERVICES.map((s) => (
                            <div key={s.id} className="p-4 rounded-lg bg-kite-card/30 border border-kite-border/50 flex flex-col justify-between hover:border-kite-border transition-all">
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <h4 className="font-bold text-sm text-kite-fg">{s.name}</h4>
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-kite-muted text-kite-fg/60">
                                    {s.type}
                                  </span>
                                </div>
                                <div className="text-xs text-kite-fg/55">Provided by: {s.provider}</div>
                              </div>
                              <div className="mt-4 pt-3 border-t border-kite-border/20 flex items-center justify-between text-xs">
                                <span className="text-kite-fg/50 font-medium font-mono">Calls: {s.calls}</span>
                                <span className="text-kite-fg/60 font-semibold">{s.cost}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ShopKite purchases tab */}
                    {activeTab === "purchases" && (
                      <div className="space-y-3">
                        <div className="px-1 mb-2 flex items-start gap-2 text-xs text-kite-fg/70 bg-kite-muted/60 border border-kite-border/40 rounded p-2.5 leading-relaxed">
                          <Sprout className="w-3.5 h-3.5 mt-0.5 text-kite-primary flex-shrink-0" />
                          <span>
                            <strong>Sample data</strong> — ShopKite purchase ledger isn't live yet.
                            Real on-chain purchase receipts will appear here when the AgentID backend ships.
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {MOCK_PURCHASES.map((p) => (
                            <div key={p.id} className="p-4 rounded-lg bg-kite-card/25 border border-kite-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-sm bg-kite-primary/10 border border-kite-primary/30 text-kite-primary flex items-center justify-center font-bold text-sm">
                                  📖
                                </span>
                                <div>
                                  <h4 className="text-sm font-bold text-kite-fg">{p.name}</h4>
                                  <div className="text-xs text-kite-fg/50 font-medium">Store: {p.store} • Purchased: {p.date}</div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end text-sm">
                                <span className="font-mono font-semibold text-kite-fg">${p.price.toFixed(2)}</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-kite-accent/15 text-kite-accent border border-kite-accent/20">
                                  {p.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Scores Detail Tab */}
                    {activeTab === "score" && (
                      <div className="p-5 bg-kite-card/35 rounded-xl border border-kite-border/80 space-y-6">
                        <div className="space-y-2">
                          <h4 className="text-base font-bold text-kite-fg mb-1 flex items-center gap-2">
                            Reputation Factor Metrics
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-kite-fg/55 bg-kite-muted border border-kite-border/60 px-1.5 py-0.5 rounded">
                              <Sprout className="w-3 h-3" /> Estimated
                            </span>
                          </h4>
                          <p className="text-xs text-kite-fg/65 max-w-xl leading-relaxed">
                            Estimated from on-chain activity — <strong>not the official AgentScore</strong>. The real AgentScore service hasn't deployed yet; once it does, this panel will switch to live data.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                          {MOCK_SCORE_FACTORS.map((factor) => {
                            let resolvedPercent = factor.percent;
                            let resolvedRaw = factor.raw;
                            if (factor.name.toLowerCase().includes("kpass")) {
                              resolvedPercent = kpassConnected ? 100 : 0;
                              resolvedRaw = kpassConnected ? "Active delegation" : "No delegator";
                            } else if (factor.name.toLowerCase().includes("volume")) {
                              resolvedRaw = `${activeProfile!.stats.token_transfers.toLocaleString()} token transfers`;
                            } else if (factor.name.toLowerCase().includes("transaction volume")) {
                              resolvedRaw = `${activeProfile!.stats.total_transactions.toLocaleString()} txs`;
                            }
                            return (
                              <div key={factor.name} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-semibold text-kite-fg">{factor.name}</span>
                                  <span className="font-mono text-xs font-semibold text-kite-primary">{resolvedPercent}% ({resolvedRaw})</span>
                                </div>
                                <div className="w-full h-2 rounded bg-kite-muted overflow-hidden relative border border-kite-border/20">
                                  <div
                                    className={`h-full rounded transition-all duration-300 ${
                                      resolvedPercent > 80 
                                        ? "bg-kite-accent" 
                                        : resolvedPercent > 50 
                                          ? "bg-kite-primary" 
                                          : "bg-kite-destructive"
                                    }`}
                                    style={{ width: `${resolvedPercent}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="pt-4 border-t border-kite-border/40 flex flex-col sm:flex-row items-center gap-3 justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs uppercase font-bold text-kite-fg/40">Active Rating Status:</span>
                            <span className="text-xs font-bold font-sans text-kite-accent uppercase flex items-center gap-1">
                              ✓ Safe Consumer Agent
                            </span>
                          </div>
                          <span className="text-[10px] text-kite-fg/40 font-mono">Epoch: 512,184</span>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* Right Profile Meta Section: Address card, Socials, Network */}
                <div className="space-y-6">
                  {/* On-chain summary card */}
                  <div className="p-5 rounded-lg bg-kite-card/35 border border-kite-border space-y-3">
                    <h4 className="font-sans text-sm font-bold text-kite-fg uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-kite-accent" /> On-chain summary
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between gap-2">
                        <span className="text-kite-fg/55 font-medium">Type</span>
                        <span className="font-semibold text-kite-fg">{activeProfile!.is_contract ? "Smart contract" : "Externally-owned account"}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-kite-fg/55 font-medium">KITE balance</span>
                        <span className="font-mono font-semibold text-kite-fg">{activeProfile!.kite_balance}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-kite-fg/55 font-medium">Tokens held</span>
                        <span className="font-mono font-semibold text-kite-fg">{activeProfile!.token_count}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-kite-fg/55 font-medium">Transactions</span>
                        <span className="font-mono font-semibold text-kite-fg">{activeProfile!.stats.total_transactions.toLocaleString()}</span>
                      </div>
                    </div>
                    <a
                      href={explorerAddressUrl(activeProfile!.address, network)}
                      target="_blank"
                      rel="noreferrer"
                      referrerPolicy="no-referrer"
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-kite-primary hover:text-kite-fg transition-colors"
                    >
                      View full record on KiteScan <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Connected Social Handles Section */}
                  <div className="p-5 rounded-lg bg-kite-card/35 border border-kite-border space-y-4">
                    <h4 className="text-sm font-bold text-kite-fg uppercase tracking-wider flex items-center gap-1.5">
                      Connected social bindings
                      <span title="Farcaster/X bindings will load once the AgentID identity backend ships." className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-kite-fg/55 bg-kite-muted border border-kite-border/60 px-1.5 py-0.5 rounded">
                        <Sprout className="w-3 h-3" /> Preview
                      </span>
                    </h4>
                    
                    <div className="space-y-2">
                      {/* ENS Name */}
                      {activeProfile!.socials.ens ? (
                        <div className="flex items-center justify-between p-2.5 rounded bg-kite-muted border border-kite-border/30 text-xs">
                          <span className="font-medium text-kite-fg/60">ENS Domain</span>
                          <span className="font-mono font-semibold text-kite-fg">{activeProfile!.socials.ens}</span>
                        </div>
                      ) : null}

                      {/* Farcaster Handle */}
                      {activeProfile!.socials.farcaster ? (
                        <div className="flex items-center justify-between p-2.5 rounded bg-kite-muted border border-kite-border/30 text-xs">
                          <span className="font-medium text-kite-fg/60">Farcaster</span>
                          <span className="font-semibold text-kite-accent">{activeProfile!.socials.farcaster}</span>
                        </div>
                      ) : null}

                      {/* Twitter Link */}
                      {activeProfile!.socials.x ? (
                        <div className="flex items-center justify-between p-2.5 rounded bg-kite-muted border border-kite-border/30 text-xs">
                          <span className="font-medium text-kite-fg/60">X / Twitter</span>
                          <span className="font-mono font-semibold text-kite-primary">{activeProfile!.socials.x}</span>
                        </div>
                      ) : null}

                      {/* None connected stub */}
                      {!activeProfile!.socials.ens && !activeProfile!.socials.farcaster && !activeProfile!.socials.x && (
                        <p className="text-xs text-kite-fg/40 py-2 text-center">No handles connected to this identity page.</p>
                      )}
                    </div>
                  </div>

                  {/* Interactive Network Stats Widget */}
                  <div className="p-5 rounded-lg kite-gradient border border-kite-border flex items-center gap-3">
                    <div className="p-2 bg-kite-accent text-white rounded">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-serif italic font-normal text-sm text-kite-fg">
                        Kite {network === "mainnet" ? "Mainnet" : "Testnet"} Live
                      </h5>
                      <p className="text-[10px] text-kite-fg/60">
                        Chain ID <span className="font-mono font-bold text-kite-accent">{network === "mainnet" ? "2366" : "2368"}</span>
                        {" "}• RPC <span className="font-mono">{network === "mainnet" ? "rpc.gokite.ai" : "rpc-testnet.gokite.ai"}</span>
                      </p>
                    </div>
                  </div>
                </div>

              </div>
              </>
              )}

            </div>
          )}

          {/* SCREEN 3: PROFILE EDITOR VIEW — local-only overlay */}
          {currentRoute.name === "edit" && activeProfile && (
            <div className="max-w-xl mx-auto py-8 animate-fade-in">
              <div className="bg-kite-card border border-kite-border rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">

                {/* Back Link */}
                <button
                  onClick={() => handleNavigate("profile", currentRoute.address)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-kite-primary hover:text-kite-fg transition-colors duration-150 mb-2"
                >
                  <span>← Back to profile page</span>
                </button>

                <div className="space-y-1">
                  <h2 className="font-instrument text-4xl text-kite-fg">Edit Display Details</h2>
                  <p className="text-xs text-kite-fg/50 font-medium">Local-only preview — saved to your browser for this session.</p>
                </div>

                {/* Honesty notice — Edit is cosmetic in v0.1 */}
                <div className="p-3 rounded bg-kite-muted border-l-4 border-kite-primary text-xs text-kite-fg/75 leading-relaxed flex items-start gap-2">
                  <Sprout className="w-3.5 h-3.5 mt-0.5 text-kite-primary flex-shrink-0" />
                  <span>
                    <strong>Preview only</strong> — these edits aren't stored on-chain or in any backend.
                    They persist locally for this browser session. Real profile customization arrives with the AgentID backend.
                  </span>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  {editError && (
                    <div className="p-3 bg-kite-destructive/10 text-kite-destructive rounded text-xs font-semibold">
                      {editError}
                    </div>
                  )}

                  {/* Avatar Upload mockup preview */}
                  <div>
                    <span className="block text-xs font-bold text-kite-fg/70 uppercase tracking-wider mb-2">Profile Avatar Icon</span>
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-kite-muted/50 border border-dashed border-kite-border">
                      <img
                        src={activeProfile!.avatar_url}
                        alt="Profile Preview"
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-md border border-kite-border bg-kite-muted"
                      />
                      <div className="space-y-1 text-xs">
                        <p className="font-semibold text-kite-fg">Deterministic Identicon</p>
                        <p className="text-kite-fg/50">Auto-resolved from your cryptographic public key string. Completely unique. No custom file uploads needed.</p>
                      </div>
                    </div>
                  </div>

                  {/* Display Name Input */}
                  <div>
                    <label htmlFor="edit-username" className="block text-xs font-bold text-kite-fg/70 uppercase tracking-wider mb-2">Display Name</label>
                    <input
                      id="edit-username"
                      type="text"
                      value={editForm.display_name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                      placeholder="e.g., Atlas Research Bot V2"
                      className="w-full bg-slate-50/10 dark:bg-black/10 border border-kite-border focus:border-kite-primary focus:outline-none rounded-md px-3 py-2 text-sm text-kite-fg placeholder-kite-fg/30 font-sans"
                    />
                  </div>

                  {/* Bio Message box */}
                  <div>
                    <label htmlFor="edit-bio" className="block text-xs font-bold text-kite-fg/70 uppercase tracking-wider mb-2">Profile Bio Description</label>
                    <textarea
                      id="edit-bio"
                      rows={4}
                      value={editForm.bio}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Write brief description of what task services this agent settles on Kite metadata..."
                      className="w-full bg-slate-50/10 dark:bg-black/10 border border-kite-border focus:border-kite-primary focus:outline-none rounded-md px-3 py-2 text-sm text-kite-fg placeholder-kite-fg/30 font-sans resize-y"
                    />
                  </div>

                  {/* Social binds */}
                  <div className="space-y-3 pt-2">
                    <span className="block text-xs font-bold text-kite-fg/60 uppercase tracking-wider">Connected blockchain social Handles</span>
                    
                    {/* ENS Name */}
                    <div>
                      <label htmlFor="edit-ens" className="block text-[11px] font-semibold text-kite-fg/70 mb-1.5">ENS Binding</label>
                      <input
                        id="edit-ens"
                        type="text"
                        value={editForm.ens}
                        onChange={(e) => setEditForm(prev => ({ ...prev, ens: e.target.value }))}
                        placeholder="e.g., walletname.eth"
                        className="w-full bg-slate-50/10 dark:bg-black/10 border border-kite-border focus:border-kite-primary focus:outline-none rounded-md px-3 py-2 text-sm text-kite-fg placeholder-kite-fg/30 font-mono"
                      />
                    </div>

                    {/* Farcaster Handle */}
                    <div>
                      <label htmlFor="edit-farcaster" className="block text-[11px] font-semibold text-kite-fg/70 mb-1.5">Farcaster Id</label>
                      <input
                        id="edit-farcaster"
                        type="text"
                        value={editForm.farcaster}
                        onChange={(e) => setEditForm(prev => ({ ...prev, farcaster: e.target.value }))}
                        placeholder="e.g., @agentpilot"
                        className="w-full bg-slate-50/10 dark:bg-black/10 border border-kite-border focus:border-kite-primary focus:outline-none rounded-md px-3 py-2 text-sm text-kite-fg placeholder-kite-fg/30 font-mono"
                      />
                    </div>

                    {/* X Twitter */}
                    <div>
                      <label htmlFor="edit-x" className="block text-[11px] font-semibold text-kite-fg/70 mb-1.5">X / Twitter Handle</label>
                      <input
                        id="edit-x"
                        type="text"
                        value={editForm.x}
                        onChange={(e) => setEditForm(prev => ({ ...prev, x: e.target.value }))}
                        placeholder="e.g., @AgentHandle"
                        className="w-full bg-slate-50/10 dark:bg-black/10 border border-kite-border focus:border-kite-primary focus:outline-none rounded-md px-3 py-2 text-sm text-kite-fg placeholder-kite-fg/30 font-mono"
                      />
                    </div>
                  </div>

                  {/* Submission actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-kite-border/40">
                    <button
                      type="button"
                      onClick={() => handleNavigate("profile", currentRoute.address)}
                      className="px-4 py-2 border border-kite-border rounded-md text-xs font-semibold text-kite-fg/70 hover:bg-kite-muted hover:text-kite-fg transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-kite-primary text-white hover:bg-kite-primary/90 px-5 py-2 rounded-md text-xs font-semibold tracking-wide transition-all cursor-pointer shadow-xs"
                    >
                      Save changes
                    </button>
                  </div>
                </form>

              </div>
            </div>
          )}

        </div>
      </main>

      {/* Tipping Dialog — preview-only in v0.1 (no wallet connected) */}
      {tippingAddress && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in" aria-modal="true" role="dialog">
          <div className="relative w-full max-w-md bg-kite-card border border-kite-border p-6 rounded-xl shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-kite-border/40 pb-3">
              <div>
                <h3 className="font-instrument text-2xl text-kite-fg font-normal leading-none mb-1">
                  Send Tip (preview)
                </h3>
                <p className="text-[10px] text-kite-fg/50 font-mono">
                  To: {tippingAddress.substring(0, 10)}...{tippingAddress.substring(tippingAddress.length - 8)}
                </p>
              </div>
              <button
                onClick={closeTipDialog}
                className="p-1 rounded hover:bg-kite-muted text-kite-fg/50 hover:text-kite-fg transition-all cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="tip-amount-input" className="block text-xs font-bold text-kite-fg/70 uppercase tracking-widest">
                  Amount (USD equivalent)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 5, 20, 50].map((num) => (
                    <button
                      key={num}
                      onClick={() => setCustomTipAmount(num.toFixed(2))}
                      className={`py-1.5 rounded font-mono text-xs font-bold border transition-all ${
                        Number(customTipAmount) === num
                          ? "bg-kite-primary text-white border-kite-primary"
                          : "bg-transparent text-kite-fg border-kite-border hover:bg-kite-muted"
                      }`}
                    >
                      ${num}
                    </button>
                  ))}
                </div>
                <div className="relative pt-1">
                  <input
                    id="tip-amount-input"
                    type="number"
                    step="0.01"
                    min="0.05"
                    value={customTipAmount}
                    onChange={(e) => setCustomTipAmount(e.target.value)}
                    placeholder="Custom amount (e.g., 2.50)"
                    className="w-full bg-slate-50/10 dark:bg-black/10 border border-kite-border focus:border-kite-primary focus:outline-none rounded-md py-2 px-3 pl-8 text-sm text-kite-fg font-mono"
                  />
                  <span className="absolute left-3 top-3.5 text-xs font-bold text-kite-fg/40">$</span>
                </div>
              </div>

              <div className="text-[11px] text-kite-fg/65 bg-kite-muted p-2.5 rounded border border-kite-border/40 flex items-start gap-2 leading-relaxed">
                <Sprout className="w-3.5 h-3.5 mt-0.5 text-kite-primary flex-shrink-0" />
                <span>
                  <strong>Preview only</strong> — AgentID v0.1 is read-only. No wallet is connected and no transaction will be sent.
                </span>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={closeTipDialog}
                  className="flex-1 bg-transparent border border-kite-border text-kite-fg text-xs font-semibold py-2 rounded-md hover:bg-kite-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => processTipping(parseFloat(customTipAmount))}
                  disabled={parseFloat(customTipAmount) <= 0 || !customTipAmount}
                  className="flex-1 bg-kite-accent text-white hover:bg-kite-accent/90 disabled:opacity-50 text-xs font-semibold py-2 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Acknowledge</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Footer Section with Theme Toggles */}
      <SiteFooter />
    </div>
  );
}
