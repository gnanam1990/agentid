import React, { useState, useEffect } from "react";
import { Sun, Moon, ArrowUpRight } from "lucide-react";

export function SiteFooter() {
  const [dark, setDark] = useState(() => {
    // Check if user has explicit dark preference or document root has dark class
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  const toggleTheme = () => {
    const nextDark = !dark;
    setDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <footer className="mt-auto border-t border-kite-border bg-kite-card/20 py-8 text-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-kite-fg/60 font-medium">
        <div className="flex items-center gap-2">
          <span>Powered by</span> 
          <a 
            href="https://gokite.ai" 
            target="_blank" 
            rel="noreferrer"
            referrerPolicy="no-referrer"
            className="flex items-center gap-0.5 text-kite-primary hover:text-kite-fg font-semibold transition-colors duration-150"
          >
            Kite <ArrowUpRight className="w-3 h-3" />
          </a>
          <span className="opacity-45">•</span>
          <span>Chain ID 2366</span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://kitescan.ai"
            target="_blank"
            rel="noreferrer"
            referrerPolicy="no-referrer"
            className="hover:text-kite-fg transition-colors duration-150"
          >
            KiteScan Explorer
          </a>
          <a
            href="https://docs.gokite.ai"
            target="_blank"
            rel="noreferrer"
            referrerPolicy="no-referrer"
            className="hover:text-kite-fg transition-colors duration-150"
          >
            API Docs
          </a>
          
          <button
            id="theme-toggle"
            onClick={toggleTheme}
            className="p-1.5 rounded-full border border-kite-border/80 hover:bg-kite-muted hover:text-kite-fg text-kite-fg/70 transition-all duration-200"
            aria-label="Toggle theme color mode"
            title="Toggle color theme"
          >
            {dark ? (
              <Sun className="w-4 h-4 text-[#e2c161]" />
            ) : (
              <Moon className="w-4 h-4 text-kite-primary" />
            )}
          </button>
        </div>
      </div>
    </footer>
  );
}
