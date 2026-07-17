import { useState } from "react";
import { Settings, Minus, Square, X, Sun, Moon, Search } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { getTheme, toggleTheme, type Theme } from "../lib/theme";
import { modKey } from "../lib/platform";
import ConnectionChip from "./ConnectionChip";
import type { ConnectionStatus } from "../lib/apiKey";

type TopBarProps = {
  onSettingsClick: () => void;
  onOpenPalette: () => void;
  connectionStatus: ConnectionStatus;
  modelCount: number;
  maskedKey: string;
  onOpenConnect: () => void;
};

export default function TopBar({
  onSettingsClick,
  onOpenPalette,
  connectionStatus,
  modelCount,
  maskedKey,
  onOpenConnect,
}: TopBarProps) {
  const win = getCurrentWindow();
  const [theme, setTheme] = useState<Theme>(getTheme());

  return (
    <div
      data-tauri-drag-region
      className="flex items-center justify-between px-4 border-b border-surface-border select-none h-10 flex-shrink-0 bg-surface-header"
    >
      <h1 data-tauri-drag-region className="text-sm font-semibold text-text-primary">
        CCCT
      </h1>

      <div className="flex items-center gap-1.5">
        <ConnectionChip
          status={connectionStatus}
          modelCount={modelCount}
          maskedKey={maskedKey}
          onClick={onOpenConnect}
        />

        <button
          className="flex items-center gap-2 text-text-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md px-2 py-1 border border-surface-border-strong hover:bg-surface-overlay text-xs"
          onClick={onOpenPalette}
          aria-label="Search everything"
        >
          <Search size={13} />
          <span className="hidden sm:inline">Search</span>
          <kbd className="font-mono text-[11px] text-text-faint">{modKey("K")}</kbd>
        </button>

        <button
          className="text-text-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded p-1.5 hover:bg-surface-overlay"
          onClick={() => setTheme(toggleTheme())}
          aria-label="Toggle light or dark theme"
        >
          {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
        </button>

        <button
          className="text-text-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded p-1"
          onClick={onSettingsClick}
          aria-label="Settings"
        >
          <Settings size={14} />
        </button>

        {/* Window controls - must not be inside drag region */}
        <div className="flex items-center ml-2">
          <button
            className="text-text-muted hover:text-text-primary focus-visible:outline-none rounded p-1.5 hover:bg-surface-overlay"
            onClick={() => win.minimize()}
            aria-label="Minimize"
          >
            <Minus size={12} />
          </button>
          <button
            className="text-text-muted hover:text-text-primary focus-visible:outline-none rounded p-1.5 hover:bg-surface-overlay"
            onClick={() => win.toggleMaximize()}
            aria-label="Maximize"
          >
            <Square size={12} />
          </button>
          <button
            className="text-text-muted hover:text-status-error focus-visible:outline-none rounded p-1.5 hover:bg-surface-overlay"
            onClick={() => win.close()}
            aria-label="Close"
          >
            <X size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
