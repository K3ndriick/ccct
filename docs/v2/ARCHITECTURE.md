> **Superseded** by [docs/decisions/why-we-didnt-build-v2.md](../decisions/why-we-didnt-build-v2.md). Preserved as historical record of the original v2 plan.

# CCCT v2 Architecture

## What v2 Adds

v1 is a three-panel session reader: browse sessions, view a session, generate a transfer prompt.

v2 adds three new surfaces - wiki, dashboard, summary - and the infrastructure that backs them: a SQLite database for persistent wiki storage, an AI audit pipeline that populates it, and a local REST API server that exposes it.

The v1 layout and data flow are unchanged. v2 extends them.

---

## Folder Structure

```
src/
  types/
    index.ts                  - all shared types (v1 + v2 additions)
  lib/
    parser.ts                 - JSONL → ParsedConversation (v1, unchanged)
    anthropic.ts              - context transfer prompt generation (v1, extended in Sprint 5)
    audit.ts                  - AI audit prompt builder + API call (new)
    summary.ts                - per-session summary prompt builder + API call (new)
    wiki.ts                   - typed wrappers around wiki invoke commands (new)
  components/
    sidebar/
      Sidebar.tsx             - extended: multi-select mode for audit (v1 base)
    conversation/
      ConversationView.tsx    - unchanged
      ConversationHeader.tsx  - extended: Summarize button (new)
      SessionSummaryPanel.tsx - structured summary display (new)
      UserMessage.tsx         - unchanged
      AssistantMessage.tsx    - unchanged
      ThinkingBlock.tsx       - unchanged
      ToolCallCard.tsx        - unchanged
    wiki/
      WikiView.tsx            - two-column layout: entry list + detail/form
      WikiEntryList.tsx       - list of entries, grouped by category
      WikiEntryCard.tsx       - collapsed entry row: title, category badge, status
      WikiEntryForm.tsx       - create/edit form
      WikiEntryDetail.tsx     - read view with metadata and linked sessions
      DraftReviewPanel.tsx    - bulk confirm/edit/discard for AI audit results
    dashboard/
      DashboardView.tsx       - top-level dashboard layout
      StatsStrip.tsx          - row of stat cards
      SessionTimeline.tsx     - Recharts chart: sessions over time
      EntryActivity.tsx       - Recharts chart: entries created over time by category
    output/
      OutputPanel.tsx         - extended: wiki toggles + entry count (Sprint 5)
    TopBar.tsx                - extended: nav mode switcher + API server status dot
  App.tsx                     - extended: appMode state, selectedProjectSlug state

src-sidecar/
  index.ts                    - Express REST server (Sprint 6)
  package.json
  tsconfig.json

src-tauri/
  src/
    commands/
      mod.rs
      fs.rs                   - read_claude_dir, read_jsonl_file (v1, unchanged)
      settings.rs             - settings persistence (v1, unchanged)
      wiki.rs                 - wiki CRUD commands (new)
      summary.rs              - session summary commands (new)
      api_server.rs           - sidecar start/stop commands (new)
    lib.rs                    - registers all commands
  migrations/
    001_initial.sql           - wiki_entries + session_summaries table definitions
```

Max one subfolder level inside `components/` - maintained.

---

## Navigation Modes

v2 introduces an `appMode` that controls what renders in the center and right panels. The sidebar always renders.

```
appMode: 'sessions' | 'wiki' | 'dashboard'
```

**sessions** (default - v1 layout)
```
┌────────────┬────────────────────────────┬────────────────┐
│  Sidebar   │   ConversationView          │  OutputPanel   │
│            │   + SessionSummaryPanel     │                │
└────────────┴────────────────────────────┴────────────────┘
```

**wiki**
```
┌────────────┬────────────────────────────┬────────────────┐
│  Sidebar   │   WikiEntryList             │  WikiEntryDetail│
│            │   (+ DraftReviewPanel)      │  or WikiEntryForm│
└────────────┴────────────────────────────┴────────────────┘
```

**dashboard**
```
┌────────────┬─────────────────────────────────────────────┐
│  Sidebar   │   DashboardView (full width)                 │
│            │   StatsStrip / SessionTimeline / EntryActivity│
└────────────┴─────────────────────────────────────────────┘
```

Mode switcher lives in the TopBar. Three icon buttons, active mode highlighted with accent color.

---

## Component Tree

```
App
  TopBar              (props: appMode, onModeChange, apiServerStatus)
  Sidebar             (props: projects, selectedConversationId, onSelectConversation,
                              selectedProjectSlug, multiSelectMode, selectedSessionIds,
                              onRunAudit)
  [appMode === 'sessions']
    ConversationView  (props: conversation | null)
      ConversationHeader (props: conversation, onSummarize, summaryState)
        SessionSummaryPanel (props: summary | null)
      UserMessage[]
      AssistantMessage[]
        ThinkingBlock[]
        ToolCallCard[]
    OutputPanel       (props: conversation | null, wikiEntries[])
  [appMode === 'wiki']
    WikiView          (props: projectSlug)
      WikiEntryList   (props: entries[], onSelect, onFilter)
        WikiEntryCard[]
      DraftReviewPanel (props: draftEntries[], onConfirm, onEdit, onDiscard) [conditional]
      WikiEntryDetail  (props: entry, onEdit) [or]
      WikiEntryForm    (props: entry | null, onSave, onCancel)
  [appMode === 'dashboard']
    DashboardView     (props: projectSlug)
      StatsStrip      (props: stats)
      SessionTimeline (props: sessionData[])
      EntryActivity   (props: entryData[])
```

---

## State Ownership

### `appMode: 'sessions' | 'wiki' | 'dashboard'`
**Lives in**: `App.tsx`
**Why**: Controls the top-level layout split. TopBar reads it to highlight the active tab; App uses it to decide which center panel to render.

### `selectedProjectSlug: string | null`
**Lives in**: `App.tsx`
**Why**: Wiki and dashboard are project-scoped, not conversation-scoped. Selecting a session implicitly sets this (derived from the session's project). Selecting a project in the sidebar without selecting a session also sets it. Both wiki and dashboard need it as their primary data key.

```ts
// derived when a conversation is selected
const selectedProjectSlug = projects
  .find(p => p.conversations.some(c => c.id === selectedConversationId))
  ?.slug ?? null
```

### `selectedConversationId: string | null`
**Lives in**: `App.tsx` - unchanged from v1.

### `selectedSessionIds: string[]` (multi-select for audit)
**Lives in**: `Sidebar.tsx` locally
**Why**: Multi-select is a sidebar-internal interaction. App only needs to know when the user clicks "Run AI Audit" - at that point the IDs are passed up via callback. No other component needs to track which sessions are checked.

### `auditState: 'idle' | 'loading' | 'done' | 'error'`
**Lives in**: `App.tsx`
**Why**: Audit triggers a mode switch (sessions → wiki, filtered to drafts) on completion. App needs to coordinate this. The state is short-lived - resets to idle once the wiki view is open.

### Wiki entry list + selected entry
**Lives in**: `WikiView.tsx` locally
**Why**: The entry list, active entry, and form state are all internal to the wiki panel. App does not need to know which entry is selected.

### Dashboard data
**Lives in**: `DashboardView.tsx` locally
**Why**: Charts are derived from DB queries on mount. No other component needs this data.

### API server status
**Lives in**: `App.tsx`
**Why**: TopBar shows a status dot; Settings panel shows start/stop controls. Both are distant in the tree. Polling `get_api_server_status` on a short interval (5s) is sufficient - no websocket needed.

---

## Data Layer

### SQLite Database

Single database file at `%APPDATA%\ccct\ccct.db`. Managed by `tauri-plugin-sql`. All wiki and summary data lives here.

**Tables:**

```sql
-- wiki_entries
CREATE TABLE IF NOT EXISTS wiki_entries (
  id TEXT PRIMARY KEY,
  project_slug TEXT NOT NULL,
  category TEXT NOT NULL,   -- decision | failed_attempt | open_question | note
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',               -- JSON array
  status TEXT NOT NULL DEFAULT 'confirmed',      -- draft | confirmed
  linked_session_ids TEXT NOT NULL DEFAULT '[]', -- JSON array
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- session_summaries
CREATE TABLE IF NOT EXISTS session_summaries (
  session_id TEXT PRIMARY KEY,
  summary_json TEXT NOT NULL,
  model TEXT NOT NULL,
  generated_at TEXT NOT NULL
);
```

**Why one DB, not per-project:** Querying across projects (e.g. dashboard aggregates) is a single SELECT. Per-project DB files require opening multiple connections and merging results. One DB with a `project_slug` column is simpler and sufficient for single-user local use.

**Why not flat JSON:** The wiki needs filtering by category, tag search, and full-text search. SQLite handles all three natively. A flat JSON file would require loading everything into memory and filtering in TypeScript on every query.

### Session Index

Unchanged from v1. `%APPDATA%\ccct\index.json` stores session metadata. The wiki layer reads from this (e.g. to populate the session-linking dropdown) but does not modify it.

### Data Flow

```
App start
  → load session index (existing, fast)
  → initialize SQLite DB, run migrations if needed
  → render with session data

User selects project
  → selectedProjectSlug set
  → wiki queries scoped to that slug

User opens wiki tab
  → WikiView mounts
  → invoke("get_wiki_entries", { projectSlug }) → entry list renders

User creates entry
  → WikiEntryForm submit
  → invoke("create_wiki_entry", { entry }) → returns saved entry
  → entry list refreshes

User runs AI audit
  → selected session IDs passed to audit.ts
  → sessions loaded via invoke("read_jsonl_file") for each
  → cleaned payload sent to Anthropic API
  → response parsed into draft WikiEntry[]
  → invoke("create_wiki_entry") called for each draft
  → appMode switches to 'wiki', entry list filtered to drafts

User generates context transfer prompt (Sprint 5)
  → invoke("get_confirmed_entries_for_prompt", { projectSlug, categories[] })
  → wiki entries merged into prompt payload
  → Anthropic API call as before
```

### REST API Sidecar (Sprint 6)

A Node.js/Express process bundled as a Tauri sidecar. Reads from `ccct.db` directly using `better-sqlite3` (synchronous, no connection pooling needed for local single-user use).

```
CCCT UI → invoke("start_api_server") → Tauri spawns sidecar process
External tool → HTTP GET localhost:3847/api/... → sidecar reads DB → JSON response
CCCT UI → invoke("stop_api_server") → Tauri kills sidecar process
```

The sidecar is stateless. It does not cache - it reads from DB on every request. DB is the source of truth.

---

## Key Design Decisions

### Navigation mode over new windows
A single `appMode` string switches what renders in the center area. No new windows, no routes, no router library. The app stays a single-page desktop UI. Switching modes is instant - no navigation overhead.

### Wiki is project-scoped by slug, not path
Entries are keyed to `project_slug`, not the full filesystem path. If the user moves a project directory, the slug stays the same and wiki entries remain associated. This matches how v1's index already identifies projects.

### SQLite initialized at app start, not on first wiki use
The DB and migration run on every app start. If the DB already exists and the schema is current, this is a no-op. This keeps startup simple - no conditional "first time" logic, no lazy initialization.

### Audit results go directly to DB as drafts
The audit flow does not hold results in component state. Each suggested entry is immediately persisted as a `draft` wiki entry via the same `create_wiki_entry` command used for manual entries. If the user closes the app mid-review, drafts are not lost.

### Sidecar reads DB directly, not through Tauri commands
The REST sidecar opens `ccct.db` itself rather than calling back to the Tauri process. This avoids IPC overhead on every API request and keeps the sidecar self-contained. The tradeoff is that the sidecar and main process both have DB connections - `WAL` journal mode handles concurrent reads safely.
