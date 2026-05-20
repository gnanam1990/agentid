import React from "react";

export function KiteLogo() {
  return (
    <div className="flex items-center gap-2 select-none">
      {/* TODO: Replace this text mark with the official Kite SVG from the brand kit once available. */}
      <span className="flex items-center justify-center w-7 h-7 rounded-sm bg-kite-primary text-kite-bg font-bold text-lg leading-none">
        K
      </span>
      <span className="text-xl font-bold tracking-tight text-kite-fg">
        Kite
      </span>
    </div>
  );
}
