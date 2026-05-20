import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  sparklineData?: number[];
  description?: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  className?: string;
}

export function StatCard({
  label,
  value,
  sparklineData,
  description,
  change,
  changeType = "positive",
  className = ""
}: StatCardProps) {
  
  // Render clean SVG sparkline
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;

    const width = 120;
    const height = 40;
    const padding = 2;
    
    const minVal = Math.min(...sparklineData);
    const maxVal = Math.max(...sparklineData);
    const delta = maxVal - minVal || 1;

    const points = sparklineData
      .map((val, i) => {
        const x = (i / (sparklineData.length - 1)) * (width - padding * 2) + padding;
        const y = height - ((val - minVal) / delta) * (height - padding * 2) - padding;
        return `${x},${y}`;
      })
      .join(" ");

    const strokeColor = changeType === "positive" 
      ? "#485C11"  // Accent olive
      : changeType === "negative" 
        ? "#A23A1A" // Destructive rust red
        : "#9B8564"; // Primary sand

    return (
      <svg className="w-24 h-10 select-none overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div className={`p-5 rounded-lg border border-kite-border bg-kite-card/40 hover:bg-kite-card/80 transition-all duration-200 shadow-sm flex flex-col justify-between ${className}`}>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-kite-fg/50 mb-1">
          {label}
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <div className="text-2xl font-bold font-mono tracking-tight text-kite-fg">
            {value}
          </div>
          {change && (
            <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1 rounded ${
              changeType === "positive" 
                ? "text-kite-accent bg-kite-accent/10"
                : changeType === "negative"
                  ? "text-kite-destructive bg-kite-destructive/10"
                  : "text-kite-primary bg-kite-primary/10"
            }`}>
              {changeType === "positive" ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : changeType === "negative" ? (
                <ArrowDownRight className="w-3 h-3" />
              ) : null}
              {change}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 mt-3 pt-2 border-t border-kite-border/40">
        <span className="text-xs text-kite-fg/60 font-medium">
          {description || "Active metrics"}
        </span>
        {renderSparkline()}
      </div>
    </div>
  );
}
