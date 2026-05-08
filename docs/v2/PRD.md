> **Superseded** by [docs/decisions/why-we-didnt-build-v2.md](../decisions/why-we-didnt-build-v2.md). Preserved as historical record of the original v2 plan.

# Product Requirements Document
## CCCT v2 - Project Knowledge Layer

**Version**: 0.1  
**Status**: In Development  
**Builds on**: CCCT v1 (complete)  
**Platform**: Windows (desktop app)  
**Stack**: React + TypeScript + Rust + Tauri

---

## What v2 Is

CCCT v1 answered: *"what happened in this conversation?"*

CCCT v2 answers: *"what do I know about this project, and how do I carry that knowledge into my next session?"*

v2 adds a persistent, human-owned knowledge base (the wiki) on top of v1's session reader and prompt generator. Knowledge can be authored manually, or extracted from sessions on demand via an AI audit. The knowledge base then feeds a richer context transfer prompt, and eventually becomes queryable by other AI tools via a local REST API.

Everything in v1 remains available. v2 adds new capabilities on top.

---

## Features

### Feature 1 - Wiki Manager

A per-project knowledge base built into the CCCT UI. Stores structured knowledge entries that persist across sessions.

**Entry types:**
- **Decision** - what was decided, with rationale
- **Failed attempt** - what was tried and abandoned, and why
- **Open question** - flagged but unresolved
- **Note** - anything else worth remembering

**Entry fields:** title, body, category, tags, status (draft | confirmed), linked session IDs, created/updated timestamps.

**Status model:**
- `confirmed` - manually authored entries start here. These are trusted and included in context transfer prompts.
- `draft` - AI-suggested entries (from the audit feature) start here. Visible in the UI but excluded from prompts until the user confirms them.

**What the UI supports:**
- Create, edit, delete entries
- Filter by category and tags
- Full-text search across all entries
- Link an entry to one or more sessions (for provenance)
- Bulk review of draft entries from an AI audit

**Storage:** SQLite database in AppData via `tauri-plugin-sql`. One database per CCCT installation; entries are scoped by project slug.

**What it does not do:** no automatic extraction, no background watching, no sync to external services.

---

### Feature 2 - AI Audit

On-demand AI-powered extraction of knowledge from session transcripts. Triggered manually by the user - never automatic.

**Flow:**
1. User selects one or more sessions in the sidebar
2. Clicks "Run AI Audit"
3. CCCT sends the session content to the Anthropic API with a structured extraction prompt
4. API returns suggested entries: decisions, failed attempts, open questions
5. Entries appear in the wiki as `draft` status
6. User reviews each draft: confirm, edit, or discard
7. Confirmed entries join the wiki

**What gets sent to the API:** same payload as the existing context transfer prompt - cleaned session content, no raw tool result data, no thinking blocks.

**Token cost:** paid once per session audit. Results are cached - re-auditing a session that hasn't changed does not call the API again.

**This is not automatic extraction.** The user decides when to run it, which sessions to include, and which suggestions to keep. The AI proposes; the human decides.

---

### Feature 3 - Dashboard

A macro view of a project's sessions and knowledge base.

**Panels:**
- **Stats strip** - session count, wiki entry count, entries by category, draft entries pending review
- **Session timeline** - when sessions happened, roughly how long they were (message count), which are summarized
- **Entry activity** - entries created over time, by category

Built with Recharts. No 3D graph, no force layout - just clear, readable charts.

---

### Feature 4 - Per-Session Summaries

A "Summarize" button on each session in the conversation viewer.

**Flow:**
1. User clicks Summarize on a session
2. CCCT calls the Anthropic API with the session content
3. Returns a structured summary: what was asked, decisions made, files touched, open threads
4. Summary is displayed in the conversation view and cached - subsequent clicks show the cached version

**Caching:** stored in AppData alongside the session index. Re-generating is possible via a "Regenerate" button.

**Model:** uses the same model selector as the context transfer prompt.

---

### Feature 5 - Context Transfer v2

An evolution of the existing "Generate Condensed Prompt" that can draw from the wiki, not just the raw session.

**New capabilities over v1:**
- Includes confirmed wiki entries relevant to the project
- Scoped by category - user can toggle which entry types to include (e.g. decisions only, or decisions + failed attempts)
- Can reference multiple sessions, not just the selected one
- Optional: filter by topic tag before generating

**Output format:** same structured format as v1. The prompt gets richer inputs; the output shape stays the same.

**What doesn't change:** one-click copy, model selector, output panel location.

---

### Feature 6 - REST API

A local HTTP server that exposes the wiki and session index to other AI tools.

**Start/stop:** controlled from the CCCT UI. When running, a status indicator shows the port. When stopped, nothing is accessible.

**Endpoints:**

```
GET  /api/project/:slug/context      → project state summary + recent wiki entries
GET  /api/project/:slug/decisions    → all confirmed decision entries
GET  /api/project/:slug/sessions     → session list with metadata
GET  /api/project/:slug/wiki         → all confirmed entries, filterable by category/tag
GET  /api/project/:slug/wiki/:id     → single entry with full detail
POST /api/project/:slug/wiki         → create a new entry (for AI write-back)
```

**Authentication:** none. Local-only, bound to `127.0.0.1`. No exposure outside the machine.

**Implementation:** Express or Fastify server running as a Tauri sidecar process.

**MCP (future):** a thin MCP wrapper that calls the same REST endpoints. REST is built first; MCP is added later as another client.

---

## Non-Features (v2 Scope)

- Automatic background extraction (no watching, no scheduled runs)
- Cross-project wiki connections (ideation doc concept - deferred)
- Obsidian vault export (deferred)
- macOS / Linux support
- Multi-user / shared knowledge bases
- Cloud sync
- Vector search / embeddings
- Light mode

---

## Build Order

Features are built in dependency order. Each feature is usable before the next begins.

```
1. Wiki Manager      ← storage + CRUD + UI
2. AI Audit          ← requires wiki (needs somewhere to put drafts)
3. Dashboard         ← requires session index (already exists) + wiki
4. Session Summaries ← requires session viewer (already exists in v1)
5. Context Transfer  ← requires wiki (to pull confirmed entries from)
6. REST API          ← requires wiki + session index
```

---

## Technical Constraints

- Tauri v2 (Rust backend + React frontend) - same stack as v1
- React 19 + TypeScript 5.9 + Vite 7
- Tailwind CSS v3
- Anthropic API: `claude-sonnet-4-6`
- Windows only, x64
- Wiki storage: SQLite via `tauri-plugin-sql`
- REST server: Express or Fastify as Tauri sidecar
- No new data sent to external services beyond Anthropic API (on explicit user action only)

---

## Success Criteria

CCCT v2 is complete when:

1. A wiki entry can be created, edited, confirmed, and deleted in the UI
2. Running an AI audit on a session produces draft entries the user can review
3. The dashboard shows a session timeline and entry stats for a real project
4. A session summary can be generated and cached with one click
5. The context transfer prompt includes wiki entries and produces a noticeably richer output than v1
6. The REST API starts from the UI and returns correct JSON for all read endpoints
