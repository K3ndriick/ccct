# CCCT Architecture

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

### `selectedConversationId: string | null`
**Lives in**: `App.tsx`
**Why**: Both Sidebar (needs to highlight active item) and ConversationView + OutputPanel (need to render it) require this value. It must live in their shared parent.
**Pattern**: Lifted state. App derives `selectedConversation` by flatMapping projects and finding by id, then passes the full `Conversation` object down to ConversationView and OutputPanel.

```ts
const selectedConversation = projects
  .flatMap(p => p.conversations)
  .find(c => c.id === selectedConversationId)
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
  | ToolCallBase & { type: 'edit';  filePath: string; diff: string }
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

```
Tauri invoke("read_claude_dir")
  -> indexer.ts (build/load index.json from AppData)
    -> App.tsx (projects: Project[], selectedConversationId state)
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

File content is loaded on demand: selecting a conversation triggers `invoke("read_jsonl_file", { path })`, the result is passed through `parseJsonl()`, and the resulting `ParsedConversation` flows down to `ConversationView` and `OutputPanel`.

---

## Key Design Decisions

### First message preview derived at render time
The sidebar shows a truncated preview of the first user message. This is derived at render, not stored as a field on `Conversation`.
```ts
conversation.messages.find(m => m.role === 'user')?.text.slice(0, 60)
```
Reason: storing it would duplicate data already in `messages[]` and require keeping it in sync.

### Output prompt is read-only
Generated prompt is shown in a `<pre>` block with a copy button. No inline editing.
Reason: target users are developers who trust the output and tweak it externally (in their editor or in the Claude chat input). Adding a textarea adds state complexity with no real user benefit.

### Output format is Claude-optimized XML
```xml
<context_transfer>
  <session_summary>...</session_summary>
  <files_modified>...</files_modified>
  <decisions_made>...</decisions_made>
  <current_state>...</current_state>
  <next_steps>...</next_steps>
</context_transfer>
```
Reason: CCCT targets developers doing serious engineering, not beginners. Dense structured XML is more token-efficient and machine-readable than prose paragraphs.

### No Radix UI in Phase 1
Collapsibles are implemented with `useState` + conditional rendering. Radix UI is not installed.
Reason: Sufficient for Phase 1. Accessibility improvements deferred to Phase 5.

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

