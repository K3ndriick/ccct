import { Settings, Minus, Square, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

type TopBarProps = {
  onSettingsClick: () => void
}

export default function TopBar({ onSettingsClick }: TopBarProps) {
  const win = getCurrentWindow();

  return (
    <div
      data-tauri-drag-region
      className="flex items-center justify-between px-4 border-b border-surface-border select-none h-10 flex-shrink-0"
    >
      <h1 data-tauri-drag-region className="text-sm font-semibold text-text-primary">CCCT</h1>

      <div className="flex items-center gap-1">
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
  )
}
