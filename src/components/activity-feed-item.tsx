import React from "react";
import {
  Cpu,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  ExternalLink,
  RotateCw,
  AlertTriangle
} from "lucide-react";
import type { LiveActivityItem } from "../lib/activity";
import { explorerTxUrl, type KiteNetwork } from "../lib/kite-chain";

interface ActivityFeedItemProps {
  item: LiveActivityItem;
  network: KiteNetwork;
}

function iconConfigFor(type: LiveActivityItem["type"]) {
  switch (type) {
    case "transfer_out":
      return {
        icon: ArrowUpRight,
        bg: "bg-kite-primary/20 border-kite-primary/30",
        color: "text-kite-primary",
        badgeLabel: "Sent"
      };
    case "transfer_in":
      return {
        icon: ArrowDownRight,
        bg: "bg-kite-accent/10 border-kite-accent/30",
        color: "text-kite-accent",
        badgeLabel: "Received"
      };
    case "token_transfer_out":
      return {
        icon: ArrowUpRight,
        bg: "bg-[#ebd9c1]/50 border-[#d8be9a]",
        color: "text-[#805f2a]",
        badgeLabel: "Token Sent"
      };
    case "token_transfer_in":
      return {
        icon: Coins,
        bg: "bg-teal-500/10 border-teal-500/20",
        color: "text-teal-600 dark:text-teal-400",
        badgeLabel: "Token In"
      };
    case "self":
      return {
        icon: RotateCw,
        bg: "bg-kite-muted border-kite-border/40",
        color: "text-kite-fg/70",
        badgeLabel: "Self"
      };
    case "contract_call":
    default:
      return {
        icon: Cpu,
        bg: "bg-kite-accent/10 border-kite-accent/20",
        color: "text-kite-accent",
        badgeLabel: "Contract"
      };
  }
}

function relativeTime(iso: string): string {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "recently";
    const diffMs = Date.now() - date.getTime();
    if (diffMs < 60_000) return `${Math.max(1, Math.floor(diffMs / 1000))}s ago`;
    if (diffMs < 3600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
    if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`;
    return `${Math.floor(diffMs / 86_400_000)}d ago`;
  } catch {
    return "recently";
  }
}

function shortHash(hash: string): string {
  if (hash.length <= 16) return hash;
  return `${hash.substring(0, 10)}…${hash.substring(hash.length - 6)}`;
}

function shortAddr(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.substring(0, 6)}…${addr.substring(addr.length - 4)}`;
}

export function ActivityFeedItem({ item, network }: ActivityFeedItemProps) {
  const cfg = iconConfigFor(item.type);
  const Icon = cfg.icon;
  const failed = item.status === "error";

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-kite-card/25 border border-kite-border/40 hover:border-kite-border/80 hover:bg-kite-card/45 transition-all duration-150 gap-4">
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div className={`p-2.5 rounded-md border ${cfg.bg} ${cfg.color} flex-shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-semibold text-kite-fg tracking-tight truncate">
              {item.description}
            </span>
            <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-sm bg-kite-muted text-kite-fg/50 flex-shrink-0">
              {cfg.badgeLabel}
            </span>
            {failed && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-sm bg-kite-destructive/15 text-kite-destructive flex-shrink-0">
                <AlertTriangle className="w-3 h-3" />
                Failed
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-kite-fg/55 flex-wrap">
            <span className="font-mono text-[11px] font-medium opacity-85 truncate">
              {shortHash(item.tx_hash)}
            </span>
            <span>•</span>
            <span className="font-medium">{relativeTime(item.timestamp)}</span>
            <span>•</span>
            <span className="font-mono text-[11px]">block #{item.block_number}</span>
            {item.counterparty && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  {item.type.endsWith("_out") ? "to" : "from"}{" "}
                  <span className="font-mono bg-kite-muted px-1 rounded text-[10px]">
                    {shortAddr(item.counterparty)}
                  </span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {item.amount && (
          <div className="text-right">
            <span className="font-mono text-sm font-semibold text-kite-fg">
              {item.amount}
              <span className="font-sans text-[10px] font-medium tracking-wide text-kite-fg/50 ml-1">
                {item.symbol}
              </span>
            </span>
          </div>
        )}

        <a
          href={explorerTxUrl(item.tx_hash, network)}
          target="_blank"
          rel="noreferrer"
          referrerPolicy="no-referrer"
          className="p-1.5 rounded hover:bg-kite-muted text-kite-fg/40 hover:text-kite-fg transition-colors duration-150"
          title="Inspect transaction on KiteScan"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
