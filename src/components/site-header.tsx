import React, { useState } from "react";
import { Search, Wallet, ShieldCheck, Globe } from "lucide-react";
import { KiteLogo } from "./kite-logo";
import type { KiteNetwork } from "../lib/kite-chain";

interface SiteHeaderProps {
  onSearch: (query: string) => void;
  onNavigate: (page: "home" | "profile" | "edit", address?: string) => void;
  kpassConnected: boolean;
  onToggleKpass: () => void;
  network: KiteNetwork;
  onToggleNetwork: () => void;
}

export function SiteHeader({
  onSearch,
  onNavigate,
  kpassConnected,
  onToggleKpass,
  network,
  onToggleNetwork
}: SiteHeaderProps) {
  const [searchInput, setSearchInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
      setSearchInput("");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-kite-border bg-kite-bg/95 backdrop-blur-sm shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div
          onClick={() => onNavigate("home")}
          className="cursor-pointer flex items-center gap-2 flex-shrink-0 hover:opacity-90 transition-opacity"
        >
          <KiteLogo />
          <span className="hidden sm:inline-block h-4 w-px bg-kite-border"></span>
          <span className="hidden sm:inline-block font-sans text-xs font-bold tracking-widest text-kite-primary uppercase">
            AgentID
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 max-w-md mx-4 relative">
          <label htmlFor="header-search" className="sr-only">Search wallet address</label>
          <input
            id="header-search"
            type="text"
            placeholder="Search 0x… address on Kite"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-kite-muted border border-kite-border/80 focus:border-kite-primary focus:outline-none rounded-md py-1.5 pl-9 pr-3 text-sm text-kite-fg placeholder-kite-fg/40 transition-all font-sans"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-kite-fg/30" />
          <button type="submit" className="sr-only">Search</button>
        </form>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onToggleNetwork}
            title={`Switch to ${network === "mainnet" ? "Testnet" : "Mainnet"}`}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border tracking-wide transition-all duration-200 ${
              network === "mainnet"
                ? "bg-kite-primary/10 text-kite-primary border-kite-primary/40"
                : "bg-kite-accent/10 text-kite-accent border-kite-accent/40"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{network === "mainnet" ? "Mainnet" : "Testnet"}</span>
          </button>
          <button
            id="kpass-connect-btn"
            onClick={onToggleKpass}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md border tracking-wide transition-all duration-200 ${
              kpassConnected
                ? "bg-kite-accent text-white border-kite-accent/50 shadow-sm"
                : "bg-transparent text-kite-fg border-kite-border hover:bg-kite-muted"
            }`}
          >
            {kpassConnected ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>kpass Active</span>
              </>
            ) : (
              <>
                <Wallet className="w-3.5 h-3.5" />
                <span>Connect kpass</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
