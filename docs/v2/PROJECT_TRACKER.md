> **Superseded** by [docs/decisions/why-we-didnt-build-v2.md](../decisions/why-we-didnt-build-v2.md). Preserved as historical record of the original v2 plan.

# Project Tracker
## CCCT v2 - Project Knowledge Layer

**Current Sprint**: Sprint 1 - Wiki Foundation  
**Overall Status**: Not happening

---

## Sprint Overview

| Sprint | Name | Status | Description |
|---|---|---|---|
| 1 | Wiki Foundation | In Progress | SQLite schema, Rust CRUD commands, basic wiki UI |
| 2 | Wiki Features + AI Audit | Not Started | Search, tags, session linking, AI-powered extraction |
| 3 | Dashboard | Not Started | Stats strip, session timeline, entry activity chart |
| 4 | Per-Session Summaries | Not Started | Summarize button, structured output, caching |
| 5 | Context Transfer v2 | Not Started | Wiki-aware prompt generation, category scoping |
| 6 | REST API | Not Started | Local HTTP server, read/write endpoints |

---

## Sprint 1 - Wiki Foundation

**Goal**: A working wiki where entries can be created, read, updated, and deleted. No search, no AI, no tags yet. Done when a real wiki entry survives an app restart and appears correctly in the UI.

**Collaboration approach**: Backend first, then UI wired to real data. No mock phase.

### Schema Design

- [ ] Define SQLite table: `wiki_entries`
  - `id` (TEXT, UUID primary key)
  - `project_slug` (TEXT) - scopes entries to a project
  - `category` (TEXT) - `decision | failed_attempt | open_question | note`
  - `title` (TEXT)
  - `body` (TEXT)
  - `tags` (TEXT) - JSON array stored as string
  - `status` (TEXT) - `draft | confirmed`
  - `linked_session_ids` (TEXT) - JSON array stored as string
  - `created_at` (TEXT, ISO timestamp)
  - `updated_at` (TEXT, ISO timestamp)
- [ ] Write migration SQL (`CREATE TABLE IF NOT EXISTS ...`)
- [ ] Decide: one DB file for all projects, or one per project?

### Rust Backend

- [ ] Add `tauri-plugin-sql` dependency to `Cargo.toml` and `package.json`
- [ ] Initialize DB on app start, run migration
- [ ] Command: `create_wiki_entry(entry: NewWikiEntry) -> WikiEntry`
- [ ] Command: `get_wiki_entries(project_slug: String) -> Vec<WikiEntry>`
- [ ] Command: `get_wiki_entry(id: String) -> WikiEntry`
- [ ] Command: `update_wiki_entry(id: String, updates: WikiEntryUpdate) -> WikiEntry`
- [ ] Command: `delete_wiki_entry(id: String) -> ()`
- [ ] Error handling: return typed errors for not-found, DB failure

### Frontend

- [ ] Add navigation mode to App.tsx: `sessions | wiki` (controls center panel content)
- [ ] Wiki mode toggle in TopBar (alongside existing settings icon)
- [ ] `WikiView.tsx` - replaces ConversationView when wiki mode is active
  - [ ] Entry list panel (left side of center area)
  - [ ] Entry detail / edit panel (right side of center area)
- [ ] `WikiEntryList.tsx` - renders list of entries for selected project, grouped by category
- [ ] `WikiEntryCard.tsx` - collapsed entry in list: title, category badge, status indicator
- [ ] `WikiEntryForm.tsx` - create/edit form: title input, body textarea, category select, status toggle
- [ ] `WikiEntryDetail.tsx` - read view: formatted body, metadata, edit button
- [ ] Wire create form → `invoke("create_wiki_entry")` → refresh list
- [ ] Wire edit form → `invoke("update_wiki_entry")` → refresh list
- [ ] Wire delete button → confirmation → `invoke("delete_wiki_entry")` → refresh list
- [ ] Empty state when no entries exist for a project
- [ ] Loading states on all async operations

---

## Sprint 2 - Wiki Features + AI Audit

**Goal**: Full-featured wiki with search and tags, plus the AI audit flow end-to-end. Done when an AI audit on a real session produces draft entries the user can review and confirm.

### Wiki Features

- [ ] Tag input component on `WikiEntryForm` (comma-separated or pill input)
- [ ] Tag display on `WikiEntryCard` and `WikiEntryDetail`
- [ ] Filter bar in `WikiEntryList`: filter by category, filter by tag
- [ ] Full-text search across title + body (SQLite `LIKE` query via new Rust command)
- [ ] Session linking: multi-select sessions from a dropdown in `WikiEntryForm`
  - [ ] `get_sessions_for_project(project_slug)` Rust command (reads from index)
  - [ ] Linked sessions displayed as clickable chips in `WikiEntryDetail`
  - [ ] Clicking a linked session navigates to that session in sessions mode

### AI Audit

- [ ] Multi-select mode in `Sidebar` - checkbox appears on hover per session
- [ ] "Run AI Audit" button appears when ≥1 session is selected
- [ ] Build extraction prompt from selected sessions (same cleaned payload as context transfer)
- [ ] System prompt instructs model to return structured JSON: `{ decisions[], failed_attempts[], open_questions[] }` each with `title` and `body`
- [ ] Call Anthropic API, parse JSON response
- [ ] Insert returned items as `draft` wiki entries for the current project
- [ ] Navigate to wiki mode, filter to drafts after audit completes
- [ ] `DraftReviewPanel.tsx` - bulk review UI
  - [ ] List of draft entries with confirm / edit / discard actions
  - [ ] "Confirm all" button
  - [ ] Edit inline before confirming
- [ ] Audit caching: store a hash of session IDs + content; skip API call if hash matches a previous audit
- [ ] Error state if API call fails during audit

---

## Sprint 3 - Dashboard

**Goal**: A dashboard view showing stats and a session timeline for the selected project. Done when real data from at least one project renders correctly in all chart types.

### Setup

- [ ] Install Recharts (`npm install recharts`)
- [ ] Add `dashboard` as a third navigation mode in App.tsx
- [ ] Dashboard icon in TopBar

### Components

- [ ] `DashboardView.tsx` - top-level dashboard layout
- [ ] `StatsStrip.tsx` - row of stat cards:
  - Total sessions
  - Total wiki entries (confirmed)
  - Entries by category (4 counts)
  - Draft entries pending review (with link to wiki draft filter)
- [ ] `SessionTimeline.tsx` - Recharts BarChart or AreaChart
  - X axis: date (by week or month)
  - Y axis: session count
  - Bar tooltip: session slugs for that period
- [ ] `EntryActivity.tsx` - Recharts BarChart
  - X axis: date (by week)
  - Y axis: entries created
  - Stacked by category
- [ ] Empty state when no sessions or wiki entries exist

### Data

- [ ] `get_dashboard_stats(project_slug)` Rust command - aggregates counts from DB + index
- [ ] Timeline data derived from session index (already in AppData)
- [ ] Entry activity data from `wiki_entries` table (group by `created_at` week)

---

## Sprint 4 - Per-Session Summaries

**Goal**: A Summarize button on any session that generates and caches a structured summary. Done when a summary survives an app restart and reappears without an API call.

### Backend

- [ ] Add `session_summaries` table to SQLite DB:
  - `session_id` (TEXT, primary key)
  - `summary_json` (TEXT) - structured summary stored as JSON string
  - `generated_at` (TEXT, ISO timestamp)
  - `model` (TEXT)
- [ ] Command: `get_session_summary(session_id) -> Option<SessionSummary>`
- [ ] Command: `save_session_summary(session_id, summary) -> ()`
- [ ] Command: `delete_session_summary(session_id) -> ()` (for regenerate flow)

### Frontend

- [ ] "Summarize" button in `ConversationHeader.tsx`
  - Disabled when session is already loading
  - Shows "Regenerate" if a cached summary exists
- [ ] Build summary prompt from parsed conversation (decisions, files touched, open threads)
- [ ] Call Anthropic API, parse structured response
- [ ] `SessionSummaryPanel.tsx` - displayed below conversation header when summary exists
  - Sections: What was asked, Decisions made, Files touched, Open threads
  - Collapsible (default open on first generation, persists user preference)
- [ ] Loading state during generation (spinner in button, panel shows skeleton)
- [ ] Error state if API call fails
- [ ] Check cache first via `get_session_summary` before calling API

---

## Sprint 5 - Context Transfer v2

**Goal**: The "Generate Condensed Prompt" output includes confirmed wiki entries and is noticeably richer than the v1 output. Done when a generated prompt from a real project contains wiki decisions and produces a usable session brief.

### Backend

- [ ] `get_confirmed_entries_for_prompt(project_slug, categories[]) -> Vec<WikiEntry>` Rust command

### Frontend

- [ ] Update `OutputPanel.tsx`:
  - [ ] Category toggles: which wiki entry types to include (decisions, failed attempts, open questions, notes)
  - [ ] "Include wiki" toggle (master switch, default on if wiki has confirmed entries)
  - [ ] Entry count indicator: "12 wiki entries will be included"
- [ ] Update `anthropic.ts` `generateContinuationPrompt`:
  - [ ] Accept `wikiEntries: WikiEntry[]` parameter
  - [ ] Add wiki entries section to the prompt payload
  - [ ] Update system prompt to instruct model on how to use wiki entries
- [ ] Fetch confirmed entries before generating, filtered by selected categories
- [ ] No change to output display - same panel, richer content

---

## Sprint 6 - REST API

**Goal**: A local HTTP server startable from the CCCT UI that returns correct JSON for all read endpoints. Done when `curl localhost:<port>/api/project/:slug/wiki` returns the project's confirmed wiki entries.

### Backend (Tauri Sidecar)

- [ ] Set up sidecar: Node.js Express server in `src-sidecar/`
- [ ] Configure sidecar in `tauri.conf.json`
- [ ] Sidecar reads from the same SQLite DB as the main app
- [ ] Implement endpoints:
  - [ ] `GET /api/project/:slug/context` - project summary + recent confirmed entries
  - [ ] `GET /api/project/:slug/decisions` - all confirmed decision entries
  - [ ] `GET /api/project/:slug/sessions` - session list with metadata
  - [ ] `GET /api/project/:slug/wiki` - all confirmed entries, filterable by `?category=` and `?tag=`
  - [ ] `GET /api/project/:slug/wiki/:id` - single entry
  - [ ] `POST /api/project/:slug/wiki` - create entry (body: title, body, category, tags)
- [ ] Bind to `127.0.0.1` only - no external exposure
- [ ] CORS: allow all origins (local-only, security is network binding not CORS)

### Rust Commands

- [ ] `start_api_server() -> port: u16`
- [ ] `stop_api_server() -> ()`
- [ ] `get_api_server_status() -> { running: bool, port: u16 | null }`

### Frontend

- [ ] API server controls in Settings panel:
  - [ ] Start / Stop button
  - [ ] Status indicator: running (green dot + port number) or stopped
  - [ ] Port config (default: 3847, user-overridable)
- [ ] TopBar status dot (small, accent-colored) when server is running

---

## Status Key

| Symbol | Meaning |
|---|---|
| Complete | Done |
| In Progress | Actively being worked on |
| Not Started | Planned but not begun |
| Blocked | Waiting on something external |