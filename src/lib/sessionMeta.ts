// Derives display metadata from a parsed conversation: files touched, counts,
// duration, a rough token estimate, a one-line gist, and the user-turn outline.
// All heuristic and local - no API calls. Used by the summary header, the
// outline tab, and the continuation panel's "captured context" list.

import type { ParsedConversation } from "../types";

export type TouchedFile = { name: string; path: string; kind: "write" | "edit" | "read" };
export type OutlineTurn = { messageIndex: number; text: string; toolCount: number };

export type SessionMeta = {
  model?: string;
  messageCount: number;
  userTurnCount: number;
  toolCallCount: number;
  durationLabel: string;
  tokenEstimate: number;
  tokenLabel: string;
  gist: string;
  files: TouchedFile[];
  outline: OutlineTurn[];
};

function basename(p: string): string {
  return p.split(/[\\/]/).pop() ?? p;
}

// write > edit > read - a file that was written outranks one merely read.
const KIND_RANK: Record<TouchedFile["kind"], number> = { write: 3, edit: 2, read: 1 };

export function formatTokens(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${k >= 10 ? Math.round(k) : k.toFixed(1)}k`;
  }
  return String(n);
}

function formatDuration(startISO: string, endISO: string): string {
  const start = new Date(startISO).getTime();
  const end = new Date(endISO).getTime();
  if (!isFinite(start) || !isFinite(end) || end < start) return "";
  const mins = Math.round((end - start) / 60000);
  if (mins < 1) return "<1 min";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function getSessionMeta(conversation: ParsedConversation): SessionMeta {
  let messageCount = 0;
  let userTurnCount = 0;
  let toolCallCount = 0;
  let charCount = 0;

  const fileMap = new Map<string, TouchedFile>();
  const outline: OutlineTurn[] = [];
  let currentTurn: OutlineTurn | null = null;

  conversation.messages.forEach((message, i) => {
    messageCount++;
    if (message.role === "user") {
      charCount += message.text.length;
      userTurnCount++;
      currentTurn = { messageIndex: i, text: message.text.trim(), toolCount: 0 };
      outline.push(currentTurn);
      return;
    }

    // assistant
    if (message.text) charCount += message.text.length;
    for (const call of message.toolCalls) {
      toolCallCount++;
      if (currentTurn) currentTurn.toolCount++;
      const kind =
        call.type === "write" ? "write" : call.type === "edit" ? "edit" : call.type === "read" ? "read" : null;
      if (kind && "filePath" in call && call.filePath) {
        const existing = fileMap.get(call.filePath);
        if (!existing || KIND_RANK[kind] > KIND_RANK[existing.kind]) {
          fileMap.set(call.filePath, { name: basename(call.filePath), path: call.filePath, kind });
        }
      }
    }
  });

  const tokenEstimate = Math.round(charCount / 4);

  // Gist fallback: the first user message, condensed to one line. (A real
  // AI-generated summary is a separate, parked feature - see the roadmap.)
  const firstUser = conversation.messages.find((m) => m.role === "user");
  const gist = firstUser && firstUser.role === "user" ? firstUser.text.replace(/\s+/g, " ").trim() : "";

  return {
    model: conversation.model,
    messageCount,
    userTurnCount,
    toolCallCount,
    durationLabel: formatDuration(conversation.firstMessageTime, conversation.lastMessageTime),
    tokenEstimate,
    tokenLabel: formatTokens(tokenEstimate),
    gist,
    files: [...fileMap.values()],
    outline,
  };
}
