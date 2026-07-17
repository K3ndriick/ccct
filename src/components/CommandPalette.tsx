import { useEffect, useMemo, useRef, useState } from "react";
import { Search, MessageSquareText, CornerDownLeft } from "lucide-react";
import type { Index } from "../lib/indexer";

export type PaletteAction = { id: string; label: string; hint?: string; run: () => void };

type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
  index: Index | null;
  onSelectConversation: (path: string) => void;
  actions: PaletteAction[];
};

const MAX_CONVERSATIONS = 20;

export default function CommandPalette({ open, onClose, index, onSelectConversation, actions }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      const id = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(id);
    }
  }, [open]);

  const conversations = useMemo(() => {
    if (!index) return [];
    const q = query.trim().toLowerCase();
    const entries = q
      ? index.entries.filter(
          (e) => e.firstMessage.toLowerCase().includes(q) || e.projectName.toLowerCase().includes(q)
        )
      : index.entries;
    return entries.slice(0, MAX_CONVERSATIONS);
  }, [index, query]);

  const filteredActions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? actions.filter((a) => a.label.toLowerCase().includes(q)) : actions;
  }, [actions, query]);

  // Flat list for keyboard navigation: conversations first, then actions.
  const flat = useMemo(
    () => [
      ...conversations.map((c) => ({ kind: "conv" as const, path: c.path })),
      ...filteredActions.map((a) => ({ kind: "action" as const, id: a.id })),
    ],
    [conversations, filteredActions]
  );

  useEffect(() => {
    setSelected((s) => Math.min(s, Math.max(0, flat.length - 1)));
  }, [flat.length]);

  function activate(i: number) {
    const item = flat[i];
    if (!item) return;
    if (item.kind === "conv") {
      onSelectConversation(item.path);
    } else {
      actions.find((a) => a.id === item.id)?.run();
    }
    onClose();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => (s + 1) % Math.max(1, flat.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => (s - 1 + flat.length) % Math.max(1, flat.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      activate(selected);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  if (!open) return null;

  const convOffset = 0;
  const actionOffset = conversations.length;
  const isEmpty = flat.length === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[80px] px-4 bg-black/55"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[560px] bg-surface-raised border border-surface-emphasis rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-surface-border">
          <Search size={16} className="text-text-faint flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search conversations, projects, actions…"
            className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-faint"
          />
          <kbd className="font-mono text-[10px] text-text-faint border border-surface-border-strong rounded px-1.5 py-0.5">
            Esc
          </kbd>
        </div>

        <div className="max-h-[340px] overflow-y-auto p-1.5">
          {isEmpty && <p className="text-center text-[12.5px] text-text-faint py-6">No matches.</p>}

          {conversations.length > 0 && (
            <>
              <p className="px-2 pt-1.5 pb-1 text-[10px] uppercase tracking-wider font-semibold text-text-faint">
                Conversations
              </p>
              {conversations.map((c, i) => {
                const idx = convOffset + i;
                return (
                  <button
                    key={c.path}
                    onMouseMove={() => setSelected(idx)}
                    onClick={() => activate(idx)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left ${
                      selected === idx ? "bg-surface-overlay" : ""
                    }`}
                  >
                    <MessageSquareText size={14} className="text-text-muted flex-shrink-0" />
                    <span className="flex-1 min-w-0 text-[13px] text-text-primary truncate">
                      {c.firstMessage || "(untitled)"}
                    </span>
                    <span className="font-mono text-[11px] text-text-faint flex-shrink-0 truncate max-w-[40%]">
                      {c.projectName}
                    </span>
                  </button>
                );
              })}
            </>
          )}

          {filteredActions.length > 0 && (
            <>
              <p className="px-2 pt-2 pb-1 text-[10px] uppercase tracking-wider font-semibold text-text-faint">
                Actions
              </p>
              {filteredActions.map((a, i) => {
                const idx = actionOffset + i;
                return (
                  <button
                    key={a.id}
                    onMouseMove={() => setSelected(idx)}
                    onClick={() => activate(idx)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left ${
                      selected === idx ? "bg-surface-overlay" : ""
                    }`}
                  >
                    <CornerDownLeft size={14} className="text-text-muted flex-shrink-0" />
                    <span className="flex-1 min-w-0 text-[13px] text-text-primary truncate">{a.label}</span>
                    {a.hint && <span className="font-mono text-[11px] text-text-faint flex-shrink-0">{a.hint}</span>}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
