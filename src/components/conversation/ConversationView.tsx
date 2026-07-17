import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import Mark from "mark.js";
import type { ParsedConversation } from "../../types";
import type { SessionMeta } from "../../lib/sessionMeta";
import UserMessage from "./UserMessage";
import AssistantMessage from "./AssistantMessage";
import SummaryHeader from "./SummaryHeader";
import ConversationSearch from "./ConversationSearch";
import { MessageSquare, AlertTriangle, ArrowUp, ArrowDown, Search } from "lucide-react";
import IconButton from "../ui/IconButton";
import { modKey } from "../../lib/platform";

export type ConversationViewHandle = {
  scrollToTurn: (messageIndex: number) => void;
};

type Filters = { thinking: boolean; tools: boolean; userOnly: boolean };

type ConversationViewProps = {
  conversation: ParsedConversation | null;
  meta: SessionMeta | null;
  error: string | null;
  isLoading: boolean;
  emptyState?: ReactNode;
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Resolve the current theme's --accent channels to a concrete rgb string for GSAP
// (GSAP can't interpolate a color that still contains a CSS var).
const accentRgb = () =>
  getComputedStyle(document.documentElement).getPropertyValue("--accent").trim().replace(/\s+/g, ",");

function FilterPill({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`inline-flex items-center gap-2 text-xs rounded-full px-2.5 py-1 border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        on
          ? "bg-accent-subtle border-accent-line text-text-primary"
          : "bg-surface-header border-surface-border-strong text-text-secondary hover:border-surface-emphasis"
      }`}
    >
      <span
        className={`w-3 h-3 rounded-[3px] grid place-items-center text-[9px] leading-none ${
          on ? "bg-accent text-on-accent" : "border border-text-faint"
        }`}
      >
        {on ? "✓" : ""}
      </span>
      {label}
    </button>
  );
}

function ConversationSkeleton() {
  return (
    <div className="p-6">
      <div className="max-w-[720px] mx-auto flex flex-col gap-6">
        <div className="skeleton h-11 w-[52%] self-end rounded-tl-[13px] rounded-tr-[13px] rounded-br-[4px] rounded-bl-[13px]" />
        <div className="flex flex-col gap-3">
          <div className="skeleton h-3 w-[30%]" />
          <div className="skeleton h-3 w-[94%]" />
          <div className="skeleton h-3 w-[80%]" />
          <div className="skeleton h-10 w-full rounded-[10px]" />
        </div>
        <div className="skeleton h-11 w-[44%] self-end rounded-tl-[13px] rounded-tr-[13px] rounded-br-[4px] rounded-bl-[13px]" />
        <div className="flex flex-col gap-3">
          <div className="skeleton h-3 w-[26%]" />
          <div className="skeleton h-3 w-[88%]" />
          <div className="skeleton h-10 w-full rounded-[10px]" />
          <div className="skeleton h-10 w-full rounded-[10px]" />
        </div>
      </div>
    </div>
  );
}

const ConversationView = forwardRef<ConversationViewHandle, ConversationViewProps>(function ConversationView(
  { conversation, meta, error, isLoading, emptyState },
  ref
) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [matchIndex, setMatchIndex] = useState(0);
  const [filters, setFilters] = useState<Filters>({ thinking: true, tools: true, userOnly: false });
  const messageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  useImperativeHandle(ref, () => ({
    scrollToTurn(messageIndex: number) {
      const el = messageRefs.current[messageIndex];
      if (!el) return;
      el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
      if (prefersReducedMotion()) return;
      const rgb = accentRgb();
      gsap.fromTo(
        el,
        { backgroundColor: `rgba(${rgb},0.16)` },
        { backgroundColor: `rgba(${rgb},0)`, duration: 1.1, ease: "power2.out", clearProps: "backgroundColor" }
      );
    },
  }));

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollTop(el.scrollTop > 100);
    setShowScrollBottom(el.scrollHeight - el.scrollTop - el.clientHeight > 100);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const matchingIndices = useMemo(() => {
    if (!searchQuery.trim() || !conversation) return [];
    const q = searchQuery.toLowerCase();
    return conversation.messages
      .map((msg, i) => ({ msg, i }))
      .filter(({ msg }) => {
        const text = msg.role === "user" ? msg.text : msg.text ?? "";
        return text.toLowerCase().includes(q);
      })
      .map(({ i }) => i);
  }, [searchQuery, conversation]);

  useEffect(() => {
    setMatchIndex(0);
  }, [searchQuery, conversation]);

  useEffect(() => {
    if (matchingIndices.length === 0) return;
    const idx = matchingIndices[matchIndex];
    messageRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [matchIndex, matchingIndices]);

  useEffect(() => {
    messageRefs.current.forEach((el) => el && new Mark(el).unmark());
    if (!searchQuery.trim()) return;
    matchingIndices.forEach((idx) => {
      const el = messageRefs.current[idx];
      if (el) new Mark(el).mark(searchQuery, { separateWordSearch: false, className: "search-highlight" });
    });
  }, [searchQuery, matchingIndices]);

  // Entrance stagger — fires once per conversation load, respects reduced motion.
  useEffect(() => {
    if (!conversation || prefersReducedMotion()) return;
    const els = messageRefs.current.filter(Boolean) as HTMLDivElement[];
    if (els.length === 0) return;
    const ctx = gsap.context(() => {
      gsap.from(els, {
        opacity: 0,
        y: 10,
        duration: 0.46,
        ease: "power2.out",
        // cap the cascade so very long sessions don't take seconds to settle
        stagger: (i: number) => Math.min(i, 12) * 0.045,
        clearProps: "transform,opacity",
      });
    });
    return () => ctx.revert();
  }, [conversation]);

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery("");
    setMatchIndex(0);
  }
  const nextMatch = () => setMatchIndex((i) => (i + 1) % matchingIndices.length);
  const prevMatch = () => setMatchIndex((i) => (i - 1 + matchingIndices.length) % matchingIndices.length);

  return (
    <div className="flex flex-col h-full min-h-0 relative bg-surface-base">
      {/* Header: session summary + search */}
      {conversation && meta && !isLoading && (
        <div className="flex-shrink-0 relative px-6 py-3.5 border-b border-surface-border bg-surface-header">
          <SummaryHeader conversation={conversation} meta={meta} />
          <div className="absolute top-3 right-4">
            {searchOpen ? (
              <ConversationSearch
                query={searchQuery}
                onQueryChange={setSearchQuery}
                matchCount={matchingIndices.length}
                currentMatch={matchIndex}
                onNext={nextMatch}
                onPrev={prevMatch}
                onClose={closeSearch}
              />
            ) : (
              <IconButton
                label="Search this conversation"
                onClick={() => setSearchOpen(true)}
                className="p-1.5 rounded-md text-text-muted hover:text-text-secondary hover:bg-surface-overlay"
              >
                <Search size={15} />
              </IconButton>
            )}
          </div>
        </div>
      )}

      {/* Filter bar */}
      {conversation && meta && !isLoading && (
        <div className="flex-shrink-0 flex items-center gap-2 px-6 py-2 border-b border-surface-border">
          <span className="text-[10.5px] uppercase tracking-wider font-semibold text-text-faint mr-1">Show</span>
          <FilterPill label="Thinking" on={filters.thinking} onClick={() => setFilters((f) => ({ ...f, thinking: !f.thinking }))} />
          <FilterPill label="Tool calls" on={filters.tools} onClick={() => setFilters((f) => ({ ...f, tools: !f.tools }))} />
          <FilterPill label="User turns only" on={filters.userOnly} onClick={() => setFilters((f) => ({ ...f, userOnly: !f.userOnly }))} />
          <span className="ml-auto text-[11px] text-text-faint tabular-nums">{meta.userTurnCount} turns</span>
        </div>
      )}

      {/* Body */}
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto relative min-h-0">
        {isLoading && <ConversationSkeleton />}

        {!isLoading && conversation && (
          <div className="flex flex-col gap-4 p-6 max-w-[760px] mx-auto">
            {conversation.messages.map((message, i) => {
              if (filters.userOnly && message.role === "assistant") return null;
              const isCurrentMatch = matchingIndices[matchIndex] === i;
              const isAnyMatch = matchingIndices.includes(i);
              return (
                <div
                  key={i}
                  ref={(el) => {
                    messageRefs.current[i] = el;
                  }}
                  className={`rounded-lg scroll-mt-4 transition-all duration-150 ${
                    isCurrentMatch ? "ring-2 ring-accent" : isAnyMatch ? "ring-1 ring-accent/40" : ""
                  }`}
                >
                  {message.role === "assistant" ? (
                    <AssistantMessage
                      text={message.text}
                      thinkingBlocks={message.thinkingBlocks}
                      toolCalls={message.toolCalls}
                      cwd={conversation.cwd}
                      showThinking={filters.thinking}
                      showTools={filters.tools}
                    />
                  ) : (
                    <UserMessage text={message.text} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && !conversation && !error &&
          (emptyState ?? (
            <div className="flex flex-col items-center justify-center h-full gap-2.5 text-center px-10">
              <MessageSquare size={40} strokeWidth={1.6} className="text-text-faint" />
              <p className="text-sm font-semibold text-text-secondary">No conversation selected</p>
              <p className="text-xs text-text-faint max-w-[36ch] leading-relaxed">
                Pick a session from the sidebar, or search across everything to jump straight to what you need.
              </p>
              <p className="mt-1 font-mono text-[11px] text-text-muted">
                Press{" "}
                <kbd className="bg-surface-overlay border border-surface-border-strong rounded px-1.5 py-0.5">{modKey("K")}</kbd> to
                search
              </p>
            </div>
          ))}

        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-10">
            <AlertTriangle size={32} className="text-status-error" />
            <p className="text-sm font-medium text-text-secondary">Failed to load conversation</p>
            <p className="text-xs text-text-faint">{error}</p>
          </div>
        )}
      </div>

      {showScrollTop && (
        <div className="absolute bottom-28 right-8">
          <IconButton
            label="Scroll to top"
            className="p-3 rounded-full bg-surface-overlay border border-surface-border-strong shadow-lg text-text-primary hover:bg-surface-hover"
            onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <ArrowUp size={20} />
          </IconButton>
        </div>
      )}
      {showScrollBottom && (
        <div className="absolute bottom-8 right-8">
          <IconButton
            label="Scroll to bottom"
            className="p-3 rounded-full bg-surface-overlay border border-surface-border-strong shadow-lg text-text-primary hover:bg-surface-hover"
            onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })}
          >
            <ArrowDown size={20} />
          </IconButton>
        </div>
      )}
    </div>
  );
});

export default ConversationView;
