# CCCT Architecture

> **The canonical architecture picture lives in [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)** - a macro system diagram and a micro data-flow/parse pipeline. This document covers the React-level detail the diagrams don't: folder structure, component render tree, and state ownership.

## What This App Does

CCCT reads Claude Code conversation files (`.jsonl`) and generates a condensed context-transfer prompt so developers can continue a session in a fresh Claude chat without losing context.

Three-panel desktop layout:
- Left: sidebar - browse projects and conversations
- Center: conversation view - read the selected session
- Right: output panel - configure and generate the transfer prompt

---

## Folder Structure

```
src/
  types/
    index.ts              - all shared TypeScript types (single source of truth)
  lib/
    parser.ts             - JSONL -> typed conversation object
    anthropic.ts          - API call to generate prompt
    indexer.ts            - build/load/update index.json in AppData
    relativeDate.ts       - human-readable date formatting
    mockData.ts           - mock data used in Phase 1 (retained, unused in prod)
  components/
    TopBar.tsx            - custom title bar with window controls
    sidebar/
      Sidebar.tsx
    conversation/
      ConversationView.tsx
      ConversationHeader.tsx
      ConversationSearch.tsx
      UserMessage.tsx
      AssistantMessage.tsx
      ThinkingBlock.tsx
      ToolCallCard.tsx
      ToolIcon.tsx
      DiffView.tsx
      toolResults/
        BashResultRenderer.tsx
        EditResultRenderer.tsx
        FileResultRenderer.tsx
        FallbackRenderer.tsx
        index.tsx
    output/
      OutputPanel.tsx
    settings/
      SettingsModal.tsx
      SettingsPanel.tsx
    ui/
      Button.tsx
      IconButton.tsx
      Input.tsx
      Card.tsx
  App.tsx                 - root, owns selectedConversationId state
  index.css               - Tailwind directives + Google Fonts import
tailwind.config.js        - design token definitions
docs/
  v1/
    PRD.md
    DESIGN.md
    PROJECT_TRACKER.md
    ARCHITECTURE.md       - this file
```

Max 1 subfolder level inside `components/`.

---

## Component Tree

```
App
  Sidebar           (props: projects, selectedConversationId, onSelectConversation)
  ConversationView  (props: conversation | null)
    UserMessage     (props: text)
    AssistantMessage(props: text?, thinkingBlocks[], toolCalls[])
      ThinkingBlock (props: text)
      ToolCallCard  (props: toolCall)
  OutputPanel       (props: conversation | null)
```

---

## State Ownership

### `selectedConversationPath: string | null`
**Lives in**: `App.tsx` (passed to Sidebar as the `selectedConversationId` prop)
**Why**: Both Sidebar (needs to highlight the active item) and ConversationView + OutputPanel (need to render it) require this value. It must live in their shared parent.
**Pattern**: Lifted state. App stores the selected file's full path. A `useEffect` keyed on that path calls `invoke("read_file", { path })`, runs the result through `parseJsonl()`, and stores the resulting `ParsedConversation` in separate `parsedConversation` state, which flows down to ConversationView and OutputPanel.

```ts
// on selectedConversationPath change:
const raw = await invoke<string>("read_file", { path: selectedConversationPath })
setParsedConversation(parseJsonl(raw))
```

### Collapse state in ThinkingBlock and ToolCallCard
**Lives in**: each component locally via `useState`
**Why**: No other component needs to know whether a thinking block or tool call is expanded. Keeping it local enforces encapsulation and prevents unnecessary re-renders up the tree.
**Initial values**:
- ThinkingBlock: `useState(false)` - always starts closed
- ToolCallCard: `useState(toolCall.result.status === 'error')` - errors start open, successes start closed

### OutputPanel state
**Lives in**: `OutputPanel.tsx` locally
**Why**: App does not need to know the selected model, the generated prompt text, or the copy feedback state. All three are internal concerns of the output panel.
- `selectedModel: string` - which Claude model to generate with
- `generatedPrompt: string | null` - null until generate is clicked
- `copied: boolean` - copy button feedback (resets after 2s)

---

## Type System

All types are in `src/types/index.ts`. No types are defined anywhere else.

### ToolCall - discriminated union
```ts
type ToolCall =
  | ToolCallBase & { type: 'read';  filePath: string }
  | ToolCallBase & { type: 'edit';  filePath: string; oldString: string; newString: string }
  | ToolCallBase & { type: 'bash';  command: string }
  | ToolCallBase & { type: 'glob';  pattern: string }
  | ToolCallBase & { type: 'write'; filePath: string }
```
**Why discriminated union**: TypeScript narrows the type on `toolCall.type`, so `toolCall.filePath` is only accessible when `type === 'read' | 'edit' | 'write'`. This catches mistakes at compile time and removes the need for runtime checks.

**ToolCallBase** is internal (not exported) - just `{ result: ToolResult }`. It is intersected into each variant to avoid repeating the result field.

### Message - discriminated union
```ts
type Message =
  | { role: 'user'; text: string }
  | { role: 'assistant'; text?: string; thinkingBlocks: ThinkingBlock[]; toolCalls: ToolCall[] }
```
**Why**: User messages only have text. Assistant messages have optional text (Claude sometimes responds with only tool calls), plus arrays for thinking blocks and tool calls. Discriminating on `role` ensures correct field access per variant.

### Data hierarchy
```
Project
  name: string
  conversations: Conversation[]

Conversation
  id: string
  projectName: string
  projectSlug: string
  projectDate: string
  messages: Message[]
```

---

## Data Flow

The macro component map and the JSONL parse pipeline are in [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md). The tree below is the React render hierarchy and prop flow specifically.

```
Tauri invoke("read_claude_dir")
  -> indexer.ts (build/load/update index.json in AppData)
    -> App.tsx (projectEntries: ProjectEntry[], index: Index, selectedConversationPath state)
      -> Sidebar (renders project/conversation list)
      -> ConversationView (renders messages)
        -> ConversationHeader
        -> ConversationSearch
        -> UserMessage
        -> AssistantMessage
          -> ThinkingBlock[]
          -> ToolCallCard[]
            -> toolResults/* (renderer per tool type)
      -> OutputPanel (model selector, generate, copy)
      -> SettingsModal -> SettingsPanel
```

Data flows **down only** via props. No context, no global store.

File content is loaded on demand: selecting a conversation triggers `invoke("read_file", { path })`, the result is passed through `parseJsonl()`, and the resulting `ParsedConversation` flows down to `ConversationView` and `OutputPanel`.

---

## Key Design Decisions

### First message preview computed during indexing
The sidebar shows a truncated preview of the first user message. It is computed once when the index is built (`indexer.ts`), truncated to 80 chars, and stored as `firstMessage` on each `IndexEntry`.
```ts
const firstUserMessage = parsed.messages.find(m => m.role === 'user')
const firstMessage = firstUserMessage?.text?.slice(0, 80) ?? ''
```
Reason: the index is cached to AppData, so the preview is parsed once and reused across launches instead of re-reading every session file on each render.

### Output prompt is read-only
Generated prompt is shown in a `<pre>` block with a copy button. No inline editing.
Reason: target users are developers who trust the output and tweak it externally (in their editor or in the Claude chat input). Adding a textarea adds state complexity with no real user benefit.

### Output is a model-generated continuation prompt, not a fixed schema
The system prompt in `anthropic.ts` instructs the model to produce a structured continuation prompt "optimised for Claude/Claude Code to consume, not human prose." CCCT does not impose a fixed template (e.g. a specific XML schema) or post-process the response - the structure is left to the model.
Reason: CCCT targets developers doing serious engineering, not beginners. A dense, machine-readable summary the next session can consume directly matters more than human prose; pinning an exact template was deferred because the model's own structured output proved sufficient.

### Collapsibles use `useState`, not Radix
Collapsibles (ThinkingBlock, ToolCallCard) are implemented with `useState` + conditional rendering. Radix UI (`@radix-ui/react-collapsible`, `@radix-ui/react-tooltip`) is listed as a dependency but is not yet imported anywhere.
Reason: the hand-rolled approach was sufficient for Phase 1; the Radix packages were added ahead of a planned accessibility pass that has not yet replaced the manual collapsibles.

---

## Design System

Tokens defined in `tailwind.config.js`, used throughout via class names.

| Token group | Purpose |
|---|---|
| `surface-base` | App background |
| `surface-raised` | Panel backgrounds, cards |
| `surface-overlay` | Hover states |
| `surface-border` | Dividers, card borders |
| `text-primary` | Main readable text |
| `text-secondary` | Labels, subtitles |
| `text-muted` | Timestamps, hints |
| `accent` | #06d472 electric green - primary CTA, active state |
| `accent-dim` | Hover of accent |
| `accent-subtle` | Thinking block background |
| `status-success/error/warning/info` | Tool result states |

Fonts:
- `font-sans` -> Inter (UI text)
- `font-mono` -> JetBrains Mono (code, generated prompt, tool output)

Google Fonts imported in `index.css` **before** `@tailwind` directives (CSS spec requires `@import` first).

