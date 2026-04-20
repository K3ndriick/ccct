import { useEffect, useMemo, useRef, useState } from "react";
import Mark from "mark.js";
import type { ParsedConversation } from "../../types";
import UserMessage from "./UserMessage";
import AssistantMessage from "./AssistantMessage";
import ConversationHeader from "./ConversationHeader";
import ConversationSearch from "./ConversationSearch";
import { MessageSquare, AlertTriangle } from "lucide-react";

type ConversationViewProps = {
  conversation: ParsedConversation | null,
  error: string | null
}

export default function ConversationView({ conversation, error }: ConversationViewProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [matchIndex, setMatchIndex] = useState(0);
  const messageRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const matchingIndices = useMemo(() => {
    if (!searchQuery.trim() || !conversation) return [];
    const q = searchQuery.toLowerCase();
    return conversation.messages
      .map((msg, i) => ({ msg, i }))
      .filter(({ msg }) => {
        const text = msg.role === 'user' ? msg.text : (msg.text ?? '');
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
    messageRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [matchIndex, matchingIndices]);

  useEffect(() => {
    messageRefs.current.forEach(el => el && new Mark(el).unmark());
    if (!searchQuery.trim()) return;
    matchingIndices.forEach(idx => {
      const el = messageRefs.current[idx];
      if (el) new Mark(el).mark(searchQuery, { separateWordSearch: false, className: 'search-highlight' });
    });
  }, [searchQuery, matchingIndices]);

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery('');
    setMatchIndex(0);
  }

  function nextMatch() {
    setMatchIndex(i => (i + 1) % matchingIndices.length);
  }

  function prevMatch() {
    setMatchIndex(i => (i - 1 + matchingIndices.length) % matchingIndices.length);
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Fixed header row - metadata left, search right */}
      {conversation && (
        <div className="flex-shrink-0 flex items-center gap-4 px-6 py-3 border-b border-surface-border bg-surface-base">
          <ConversationHeader conversation={conversation} />
          {searchOpen && (
            <div className="ml-auto flex-shrink-0">
              <ConversationSearch
                query={searchQuery}
                onQueryChange={setSearchQuery}
                matchCount={matchingIndices.length}
                currentMatch={matchIndex}
                onNext={nextMatch}
                onPrev={prevMatch}
                onClose={closeSearch}
              />
            </div>
          )}
        </div>
      )}

      {/* Scrollable message area */}
      <div className="flex-1 overflow-y-auto relative min-h-0">

        {conversation && (
          <div className="flex flex-col gap-4 p-6">
            {conversation.messages.map((message, i) => {
              const isCurrentMatch = matchingIndices[matchIndex] === i;
              const isAnyMatch = matchingIndices.includes(i);
              return (
                <div
                  key={i}
                  ref={el => { messageRefs.current[i] = el; }}
                  className={`rounded-lg transition-all duration-150 ${
                    isCurrentMatch ? 'ring-2 ring-accent' :
                    isAnyMatch    ? 'ring-1 ring-accent/40' : ''
                  }`}
                >
                  {message.role === "assistant"
                    ? <AssistantMessage text={message.text} thinkingBlocks={message.thinkingBlocks} toolCalls={message.toolCalls} />
                    : <UserMessage text={message.text} />
                  }
                </div>
              );
            })}
          </div>
        )}

        {!conversation && !error && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <MessageSquare size={32} className="text-text-muted" />
            <p className="text-sm font-medium text-text-secondary">Select a conversation</p>
            <p className="text-xs text-text-muted">Pick a session from the sidebar to view it here.</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <AlertTriangle size={32} className="text-status-error" />
            <p className="text-sm font-medium text-text-secondary">Failed to load conversation</p>
            <p className="text-xs text-text-muted">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
