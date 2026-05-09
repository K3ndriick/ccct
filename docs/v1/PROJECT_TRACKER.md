# CCCT Project Tracker
## Claude Code Context Transfer

**Current Phase**: Phase 5 - Index + Polish
**Overall Status**: Complete

---

## Phase Overview

| Phase | Name | Status | Description |
|---|---|---|---|
| 1 | Frontend UI | Complete | Build the full React UI with mocked data |
| 2 | Parser | Complete | JSONL parsing logic in TypeScript |
| 3 | Anthropic API | Complete | Generate condensed prompt feature |
| 4 | Tauri Filesystem | Complete | Real file access via Rust backend |
| 5 | Index + Polish | Complete | Index system, settings, polish, and build |

---

## Phase 1 - Frontend UI
**Goal**: Build the complete React interface using hardcoded mock data. No real files, no API calls, no Tauri. Done when the app looks right and all components render correctly.

**Collaboration approach**: User builds with AI guidance (tutoring style - reasoning through decisions together before coding).

### Completed

#### Project Setup
- [x] Scaffold Vite + React + TypeScript
- [x] Install and configure Tailwind CSS v3
- [x] Initialize Tauri (`cargo tauri init`)
- [x] Verify `cargo tauri dev` opens desktop window
- [x] Install Lucide React (`npm install lucide-react`)
- [x] Set up folder structure (`components/`, `lib/`, `types/`)
- [x] Apply design tokens from DESIGN.md to `tailwind.config.js` and `index.css`
- [x] Google Fonts set up (Inter + JetBrains Mono) - imported before @tailwind directives in index.css

#### Layout Shell
- [x] App shell with 3-panel flex layout (sidebar fixed 240px, conversation flex-1, output panel fixed 320px)
- [x] Design tokens applied throughout (surface-*, text-*, accent-* color system)

#### Sidebar
- [x] `Sidebar.tsx` - renders Project[] with nested conversation items
- [x] Active/selected state with accent color highlight
- [x] `onSelectConversation` callback lifted to App.tsx

#### Conversation View
- [x] `ConversationView.tsx` - maps messages, delegates to UserMessage or AssistantMessage
- [x] `UserMessage.tsx` - bubble with "You" label, self-end aligned
- [x] `AssistantMessage.tsx` - left border accent line, "Claude" label, renders text + ThinkingBlocks + ToolCallCards
- [x] `ThinkingBlock.tsx` - collapsible (default closed), amber left border, chevron in header
- [x] `ToolCallCard.tsx` - collapsible (errors default open), discriminated union renders filePath or command in header, chevron in header

#### Output Panel
- [x] `OutputPanel.tsx` - model selector (3 hardcoded models), generate button, copy button
- [x] Generate button disabled when no conversation selected (greyed out)
- [x] Copy button with Check/Copy icon swap (2s feedback) via `navigator.clipboard`
- [x] Generated prompt displayed in monospace `<pre>` block

#### Types (`src/types/index.ts`)
- [x] `ThinkingBlock`, `ToolResult`, `ToolCallBase`
- [x] `ToolCall` - discriminated union: read | edit | bash | glob | write
- [x] `Message` - discriminated union: user | assistant
- [x] `Conversation`, `Project`

#### Mock Data (`src/lib/mockData.ts`)
- [x] 1 project, 1 conversation with user message + assistant message
- [x] Thinking block, 2 read tool calls (1 success, 1 error)

---


## Phase 2 - Parser
**Goal**: Write `parser.ts` in pure TypeScript. Takes raw `.jsonl` file content and returns a typed, cleaned conversation object. No UI changes. Tested against real `.jsonl` files in `src/lib/testdata/` (7 files already copied in).

Reference: `docs/JSONL_FORMAT.md` for full format spec and pipeline diagram.

### Chunks

#### Chunk 1 - Raw input types
Add types to `src/types/index.ts` that describe the raw JSONL records:
- [x] `RawRecord` - full shape of one line from the file (uuid, sessionId, timestamp, type, message, toolUse, toolUseResult, isMeta, isSidechain, cwd, etc.)
- [x] `ContentBlock` - discriminated union for `message.content[]` blocks: `text | thinking | tool_use`

These are input types only - they describe what we parse, not what we output.

#### Chunk 2 - Output types
Add new output types the parser will produce to `src/types/index.ts`:
- [x] metadata fields (sessionId, cwd, model, firstMessageTime, lastMessageTime) inlined into ParsedConversation
- [x] `ParsedConversation` - wraps metadata + `Message[]` (decide: extend or replace existing `Conversation` type)

#### Chunk 3 - Parser skeleton + filtering
Write the `parseJsonl(raw: string): ParsedConversation` function in `src/lib/parser.ts`:
- [x] Split string into lines, parse each as JSON
- [x] Filter out noise: `queue-operation`, `file-history-snapshot`, `progress`, `system`, `isMeta === true`, `isSidechain === true`
- [x] Extract metadata from first kept records (sessionId, cwd, model, firstMessageTime)

#### Chunk 4 - Message building
The main parsing logic:
- [x] User records: extract text from content (handle string vs array, strip base64 document blocks)
- [x] Assistant records: split `content[]` into text blocks, thinking blocks, tool_use blocks
- [x] Tool result linking: pending map keyed by `tool_use_id` to match calls with results
- [x] Assemble final `Message[]` in order

#### Chunk 5 - Test runner + verification
- [x] Write `src/lib/parserTest.ts` - reads a testdata file, calls `parseJsonl()`, logs output
- [x] Run against actual chat log files from disk
- [x] Verify metadata extraction is correct
- [x] Verify all tool types are handled

---

## Phase 3 - Anthropic API
**Goal**: Wire up the "Generate Condensed Prompt" button to the real Anthropic API. Build the payload from parsed conversation data, call the API, display the result.

### Tasks

#### API Integration (`src/lib/anthropic.ts`)
- [x] Build structured payload from `ParsedConversation` object
  - [x] Include: project metadata, user messages, tool call summary, assistant responses
  - [x] Exclude: thinking blocks, raw tool result content
- [x] Define system prompt for condensing conversations
- [] Output format: structured XML (`<context_transfer>` with named sections) - optimised for Claude, not human prose
- [x] Output format: currently markdown format, can be adjusted in future
- [x] Calls user-selected model via model selector
- [x] Handle API errors gracefully (show error state in output panel)
- [x] Handle loading state in GenerateButton

#### API Key (dev mode)
- [x] Read API key from `.env` file during development (`VITE_ANTHROPIC_API_KEY`)
- [x] Add `.env` to `.gitignore`

#### Output
- [x] Connect API response to `PromptDisplay` component
- [x] Verify generated prompt matches expected format from PRD

---

## Phase 4 - Tauri Filesystem
**Goal**: Replace hardcoded mock data with real Claude Code session data read from disk via Rust.

### Tasks

#### Rust Commands (`src-tauri/src/commands/`)
- [x] `read_claude_dir` - scan `C:\Users\<n>\.claude\projects\` and return list of project folders + jsonl files
- [x] `read_jsonl_file` - read a single `.jsonl` file and return its content as a string
- [x] `get_appdata_path` - not built as a dedicated command; AppData path resolved inline via `std::env::var("APPDATA")` in each command that needs it

#### Frontend Integration
- [x] Replace mock data source with real `invoke("read_claude_dir")` call
- [x] Replace mock conversation data with `invoke("read_jsonl_file", { path })` call
- [x] Connect parser to real file content
- [x] Handle loading states during file reads
- [x] Handle errors (file not found, permission denied, etc.)

#### Auto-detect Claude Directory
- [ ] Detect `C:\Users\<n>\.claude` automatically on first launch - not implemented; user sets path manually in Settings
- [ ] Fall back to settings value if not found - not implemented (superseded by manual settings flow)

---

## Phase 5 - Index + Polish

### Tasks

#### Index System
- [x] `indexer.ts` - build index from parsed conversation metadata
- [x] Store index as `index.json` in `C:\Users\<n>\AppData\Roaming\ccct\`
- [x] On app open: load index first (instant), then scan for new files
- [x] Parse only new `.jsonl` files not yet in index
- [x] Add to index incrementally
- [x] Re-index button triggers full rebuild

#### Settings
- [x] Settings panel UI (slide-in or modal)
- [x] Claude directory path field (auto-detected, overridable)
- [x] API key input - stored in OS keychain via Tauri's secure storage (not `.env`)
- [x] Auto-index on open toggle
- [x] Settings persisted to `settings.json` in AppData (except API key)
- [x] Hardcoded Claude dir path removed from `read_claude_dir`
- [x] API key loaded from keychain in `generateContinuationPrompt`

#### Polish
- [x] App icon (simple amber `C` on dark background)
- [x] Window title bar styling
- [x] Empty states (no sessions found, no session selected)
- [x] Error states for all failure points
- [x] Keyboard accessibility (tab through sidebar, Enter to select)
- [x] Markdown rendering in AssistantMessage

#### Build & Distribution
- [x] Configure `tauri.conf.json` for production build
- [x] Run `cargo tauri build` and verify `.msi` installer works
- [x] Test on clean Windows machine (no dev tools installed)
- [ ] Add screenshots to README
- [ ] Record 90-second Loom demo

---

## Status Key

| Symbol | Meaning |
|---|---|
| Complete | Done |
| In Progress | Actively being worked on |
| Not Started | Planned but not begun |
| Blocked | Waiting on something external |
