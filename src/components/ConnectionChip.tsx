import { Check, KeyRound, AlertTriangle } from "lucide-react";
import type { ConnectionStatus } from "../lib/apiKey";

type ConnectionChipProps = {
  status: ConnectionStatus;
  modelCount: number;
  maskedKey: string;
  onClick: () => void;
};

// Titlebar connection indicator. Deliberately NOT a live green dot - meaning is
// carried by the icon + label + shape; color only appears when something is wrong.
// Connected reads "Anthropic - N models" with a check glyph (the key unlocks a set
// of models to pick from per transfer); disconnected doubles as the entry point.
export default function ConnectionChip({ status, modelCount, maskedKey, onClick }: ConnectionChipProps) {
  const base =
    "inline-flex items-center gap-1.5 h-[26px] rounded-md border px-2 text-xs leading-none transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

  if (status === "connected") {
    return (
      <button
        onClick={onClick}
        aria-label="Manage Anthropic API connection"
        title={`${modelCount} models available for context transfer · ${maskedKey} · stored in your OS keychain`}
        className={`${base} bg-surface-raised border-surface-border-strong text-text-secondary hover:border-surface-emphasis hover:text-text-primary`}
      >
        <Check size={13} strokeWidth={2.5} className="text-text-secondary" />
        <span className="font-medium">Anthropic</span>
        <span className="text-text-faint">·</span>
        <span className="font-mono text-text-muted tabular-nums">{modelCount} models</span>
      </button>
    );
  }

  if (status === "error") {
    return (
      <button
        onClick={onClick}
        aria-label="Reconnect Anthropic API key"
        title="Couldn't verify your API key - click to reconnect"
        className={`${base} bg-surface-raised border-status-warning/40 text-status-warning hover:border-status-warning`}
      >
        <AlertTriangle size={13} strokeWidth={2.2} />
        <span className="font-medium">Reconnect</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      aria-label="Connect your Anthropic API key"
      title="Connect your Anthropic API key"
      className={`${base} bg-surface-raised border-surface-border-strong text-text-muted hover:border-surface-emphasis hover:text-text-secondary`}
    >
      <KeyRound size={13} strokeWidth={2} />
      <span className="font-medium">Connect key</span>
    </button>
  );
}
