import React from "react";

interface UsdcAmountProps {
  amount: number;
  className?: string;
  showSuffix?: boolean;
}

export function UsdcAmount({ amount, className = "", showSuffix = true }: UsdcAmountProps) {
  // Format with commas and 2 decimals (or max decimals if very small)
  const isTooSmall = amount > 0 && amount < 0.01;
  const formatted = isTooSmall 
    ? amount.toFixed(4)
    : amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <span className={`font-mono inline-flex items-center gap-1 ${className}`}>
      <span className="text-sm font-medium opacity-70 font-sans">$</span>
      <span className="font-semibold">{formatted}</span>
      {showSuffix && (
        <span className="text-[10px] font-sans font-medium px-1 py-0.5 rounded bg-kite-muted text-kite-fg/60 ml-1">
          USDC.e
        </span>
      )}
    </span>
  );
}
