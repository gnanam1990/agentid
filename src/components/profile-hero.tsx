import React from "react";
import { ExternalLink, Edit, DollarSign, FileCode, Sprout } from "lucide-react";
import { AddressDisplay } from "./address-display";
import { TierBadge } from "./tier-badge";
import type { LiveAgentProfile } from "../lib/profile";
import { explorerAddressUrl } from "../lib/kite-chain";

interface ProfileHeroProps {
  profile: LiveAgentProfile;
  isOwner: boolean;
  onEdit: () => void;
  onTipClick: () => void;
}

export function ProfileHero({ profile, isOwner, onEdit, onTipClick }: ProfileHeroProps) {
  return (
    <div className="w-full bg-kite-card border border-kite-border rounded-xl p-6 sm:p-8 shadow-sm transition-colors duration-200">
      <div className="flex flex-col lg:flex-row items-start justify-between gap-6 lg:gap-8">

        {/* Left Side: Avatar & Core Information */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <img
              src={profile.avatar_url}
              alt={`${profile.display_name} Avatar`}
              referrerPolicy="no-referrer"
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg border-2 border-kite-primary/40 object-cover bg-kite-muted"
            />
            {profile.is_contract && (
              <span
                title="Smart contract"
                className="absolute -bottom-2 -right-2 bg-kite-primary text-white p-1 rounded-full border-2 border-kite-card"
              >
                <FileCode className="w-4 h-4" />
              </span>
            )}
          </div>

          <div className="text-center sm:text-left min-w-0 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-wrap mb-1.5 justify-center sm:justify-start">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-kite-fg leading-none">
                {profile.display_name}
              </h1>
              <div className="flex justify-center flex-wrap gap-2">
                <TierBadge tier={profile.tier} score={profile.score} />
                <span
                  title="AgentScore service not deployed yet — tier and score are estimated from on-chain activity."
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold bg-kite-muted text-kite-fg/55 border border-kite-border/60"
                >
                  <Sprout className="w-3 h-3" />
                  Estimated
                </span>
              </div>
            </div>

            <div className="mb-4">
              <AddressDisplay
                address={profile.address}
                charLimit={6}
                className="text-kite-fg/60 hover:text-kite-fg text-sm transition-colors duration-150"
              />
            </div>

            <p className="text-sm sm:text-base text-kite-fg/80 leading-relaxed max-w-2xl font-sans">
              {profile.bio}
            </p>

            <div className="mt-4 text-xs text-kite-fg/50 font-medium flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>
                Network:{" "}
                <span className="font-mono text-[11px] font-semibold">
                  Kite {profile.network === "mainnet" ? "Mainnet" : "Testnet"}
                </span>
              </span>
              {profile.first_seen && (
                <span>
                  First seen:{" "}
                  <span className="font-mono text-[11px] font-semibold">
                    {new Date(profile.first_seen).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric"
                    })}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex flex-row lg:flex-col items-center justify-center lg:items-stretch gap-3 w-full lg:w-48 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-kite-border/60 pt-6 lg:pt-0 lg:pl-6">
          <button
            onClick={onTipClick}
            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 bg-kite-accent text-white hover:bg-kite-accent/90 px-4 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-150 cursor-pointer shadow-xs"
          >
            <DollarSign className="w-4 h-4" />
            <span>Tip (preview)</span>
          </button>

          <a
            href={explorerAddressUrl(profile.address, profile.network)}
            target="_blank"
            rel="noreferrer"
            referrerPolicy="no-referrer"
            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 bg-kite-muted hover:bg-kite-border/40 text-kite-fg border border-kite-border px-4 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-150"
          >
            <span>KiteScan Explorer</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>

          {isOwner ? (
            <button
              onClick={onEdit}
              className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 bg-transparent border border-kite-primary/60 hover:bg-kite-primary/10 text-kite-fg hover:text-kite-fg px-4 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-150 cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit (local)</span>
            </button>
          ) : (
            <div className="hidden lg:flex items-center gap-1 justify-center text-[11px] text-kite-fg/45 font-medium mt-1">
              <span>View-only Guest Mode</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
