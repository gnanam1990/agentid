import React from "react";
import { ShieldAlert, ShieldCheck, Flame, Medal, Award } from "lucide-react";

interface TierBadgeProps {
  tier: "untrusted" | "rookie" | "verified" | "trusted" | "elite";
  score: number;
  className?: string;
}

export function TierBadge({ tier, score, className = "" }: TierBadgeProps) {
  let config = {
    label: "Rookie",
    bg: "bg-[#ebd9c1] dark:bg-[#2e261b] text-[#5c4a31] dark:text-[#ebd9c1]",
    border: "border-[#d8be9a] dark:border-[#423421]",
    icon: Flame
  };

  switch (tier) {
    case "untrusted":
      config = {
        label: "Untrusted",
        bg: "bg-[#e5dfd5] dark:bg-[#25221d] text-[#706456] dark:text-[#a09485]",
        border: "border-[#cac1b3] dark:border-[#38342e]",
        icon: ShieldAlert
      };
      break;
    case "rookie":
      config = {
        label: "Rookie",
        bg: "bg-[#ebd9c1] dark:bg-[#2e261b] text-[#805f2a] dark:text-[#cca35e]",
        border: "border-[#d8be9a] dark:border-[#4a3b25]",
        icon: Flame
      };
      break;
    case "verified":
      config = {
        label: "Verified",
        bg: "bg-[#e6ebdf] dark:bg-[#1a2e1d] text-[#334a1a] dark:text-[#a5cca8]",
        border: "border-[#ccd9be] dark:border-[#223d26]",
        icon: ShieldCheck
      };
      break;
    case "trusted":
      config = {
        label: "Trusted",
        bg: "bg-[#f2ebe0] text-kite-primary dark:bg-kite-muted border-kite-primary/30",
        border: "border-kite-primary/30 dark:border-kite-primary/40",
        icon: Award
      };
      break;
    case "elite":
      config = {
        label: "Elite",
        bg: "bg-[#e2edd3] text-[#2c4013] dark:bg-[#182a12] dark:text-[#b4e08c]",
        border: "border-[#aecca5] dark:border-[#2b4c19] ring-1 ring-[#c0a256]/40",
        icon: Medal
      };
      break;
  }

  const Icon = config.icon;

  return (
    <div
      id={`tier-badge-${tier}`}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${config.bg} ${config.border} ${className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>
        {config.label} <span className="opacity-60">•</span> {score}
      </span>
    </div>
  );
}
