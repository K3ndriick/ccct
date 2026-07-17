import { useMemo } from "react";
import { KeyRound, Search, Check, MessageSquare, ChevronRight } from "lucide-react";
import type { Index } from "../../lib/indexer";
import type { ConnectionStatus } from "../../lib/apiKey";
import { modKey } from "../../lib/platform";

type HomeScreenProps = {
  connectionStatus: ConnectionStatus;
  modelCount: number;
  onOpenConnect: () => void;
  index: Index | null;
  onSelectConversation: (path: string) => void;
  onOpenPalette: () => void;
};

// Adaptive landing shown in the center pane when no session is selected.
// Not connected → leads with onboarding; connected → leads with recent sessions.
export default function HomeScreen({
  connectionStatus,
  modelCount,
  onOpenConnect,
  index,
  onSelectConversation,
  onOpenPalette,
}: HomeScreenProps) {
  const recent = useMemo(() => {
    if (!index) return [];
    return [...index.entries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [index]);

  const connected = connectionStatus === "connected";

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[820px] mx-auto px-8 py-16 flex flex-col gap-8">
        {/* brand */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center w-9 h-9 rounded-[10px] bg-surface-overlay border border-surface-border-strong font-mono text-sm font-semibold text-text-secondary">
              C
            </span>
            <span className="text-[15px] font-semibold tracking-[-0.01em] text-text-primary">Claude Code Context Transfer (CCCT)</span>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed max-w-[52ch]">
            Pick up any Claude Code session where it left off. Browse your history, then hand a
            session off as a ready-to-paste continuation prompt.
          </p>
        </div>

        {/* search bar - full width, moved up */}
        <button
          onClick={onOpenPalette}
          className="flex items-center gap-2.5 w-full rounded-lg border border-surface-border-strong bg-surface-raised px-3.5 py-2.5 text-sm text-text-muted hover:text-text-secondary hover:border-surface-emphasis transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Search size={15} className="flex-shrink-0" />
          <span className="flex-1 text-left">Search everything</span>
          <kbd className="font-mono text-[10px] text-text-faint">{modKey("K")}</kbd>
        </button>

        {/* two columns: connection (left) · recent chats (right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* connection column */}
          {connected ? (
            <div className="rounded-xl border border-surface-border-strong bg-surface-overlay p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span className="grid place-items-center w-7 h-7 rounded-lg bg-surface-raised border border-surface-border-strong text-text-secondary">
                  <Check size={14} strokeWidth={2.5} />
                </span>
                <h2 className="text-sm font-semibold text-text-primary">Anthropic connected</h2>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                <span className="font-mono tabular-nums">{modelCount}</span> models are ready for
                context transfer. Your key is stored in your OS keychain.
              </p>
              <button
                onClick={onOpenConnect}
                className="self-start inline-flex items-center gap-2 rounded-md border border-surface-border-strong bg-surface-raised text-sm text-text-secondary hover:text-text-primary hover:border-surface-emphasis px-3.5 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Manage connection
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-surface-border-strong bg-surface-overlay p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span className="grid place-items-center w-7 h-7 rounded-lg bg-surface-raised border border-surface-border-strong text-text-secondary">
                  <KeyRound size={14} strokeWidth={2} />
                </span>
                <h2 className="text-sm font-semibold text-text-primary">Connect your Anthropic API key</h2>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                CCCT uses it to turn a past session into a continuation prompt. Your key is stored in
                your OS keychain and sent only to Anthropic, never to us.
              </p>
              <button
                onClick={onOpenConnect}
                className="self-start inline-flex items-center gap-2 rounded-md bg-accent text-on-accent text-sm font-semibold px-3.5 py-2 hover:bg-accent-dim transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <KeyRound size={14} strokeWidth={2} />
                {connectionStatus === "error" ? "Reconnect key" : "Connect key"}
              </button>
            </div>
          )}

          {/* recent chats column */}
          <div className="flex flex-col gap-2">
            <span className="text-[10.5px] uppercase tracking-wider font-semibold text-text-faint">Recent</span>
            {recent.length > 0 ? (
              <div className="flex flex-col">
                {recent.map((entry) => (
                  <button
                    key={entry.path}
                    onClick={() => onSelectConversation(entry.path)}
                    className="group flex items-center gap-3 rounded-lg px-3 py-2.5 -mx-3 text-left hover:bg-surface-overlay transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <MessageSquare size={14} className="text-text-faint flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-text-secondary group-hover:text-text-primary truncate transition-colors">
                        {entry.firstMessage || "Untitled session"}
                      </p>
                      <p className="text-[11px] font-mono text-text-faint truncate">
                        {entry.projectName} · {relativeTime(entry.date)}
                      </p>
                    </div>
                    <ChevronRight
                      size={14}
                      className="text-text-faint opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-faint leading-relaxed py-2">
                Your recent sessions will appear here once you open one from the sidebar.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact relative-time formatter for the recent list.
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const secs = Math.floor((Date.now() - then) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
