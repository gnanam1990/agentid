import React from "react";

export function KiteLogo() {
  return (
    <div className="flex items-center gap-2 select-none">
      {/* Visual Seal Accent */}
      <span className="flex items-center justify-center w-7 h-7 rounded-sm bg-kite-primary text-kite-bg font-instrument font-medium text-lg leading-none pt-0.5">
        K
      </span>
      <span className="font-instrument text-2xl tracking-wide font-normal text-kite-fg">
        Kite
      </span>
    </div>
  );
}
