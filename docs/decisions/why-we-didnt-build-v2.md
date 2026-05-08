# Scoping v2

**Date**: 2026 May
**Status**: Supersedes the original v2 plan in [docs/v2/](../v2/). New direction documented here.

---

## Context

CCCT v1 shipped: a desktop app that reads Claude Code session JSONLs and generates a context transfer prompt for continuing work in a fresh session.

v2 was originally planned as a 6-sprint expansion: SQLite-backed wiki, AI audit extraction, dashboard with charts, per-session summaries, wiki-aware context transfer, and a local REST API. Full plan in [docs/v2/PRD.md](../v2/PRD.md).

After roughly a month of iterating on v2 design (with detours through nodes/RAG and skill-folder alternatives - see [docs/v2/CONTEXT_ARCHITECTURE_NOTES.md](../v2/CONTEXT_ARCHITECTURE_NOTES.md)), a stress test of the underlying premise led to a fundamental rescoping. This document captures what changed, why, and what the new direction is.

---

## What the stress test surfaced

The original v2 framing was "wiki for Claude Code sessions." The actual problem the user has is broader:

> "I have multiple projects (coding, job applications, research, etc). Each has a pile of notes. When I work on one project, I want AI to be able to read notes from another project. CCCT should be the manager and query layer for those notes."

That reframing breaks several assumptions in the original v2 plan:

1. Notes aren't only extracted from sessions - they're authored, pasted, dropped in as PDFs/URLs, etc.
2. "Project" isn't only a coding project - it's any context with a note pile.
3. The primary consumer isn't only the CCCT UI - it's AI agents (Claude Code, Claude Desktop, potentially others) reading across projects.
4. The data model isn't atomic structured entries - it's heterogeneous files (md, pdf, xlsx, urls).

Each of these invalidates a different part of the original v2 architecture.

---

## Pivots

### Pivot 1 - Drop the AI audit pipeline

**Original**: AI audit ingests sessions and extracts decisions / failed_attempts / open_questions as draft wiki entries the user reviews.

**Why dropped**: extraction-first treats sessions as the privileged input. In the actual use case, sessions are one source among many, and the user often wants to author notes directly ("here's a PRD I want you to format") rather than have them extracted. The audit also frames AI as the curator; the better model is human-curated notes that AI consumes.

### Pivot 2 - Generalize "project" beyond coding work

**Original**: a project = a folder of Claude Code sessions for a coding project.

**Why changed**: real use case is 5+ projects across multiple domains. Sessions are one input. The unit is "a context with curated notes," not "a session log."

### Pivot 3 - Filesystem-first, not SQLite-first

**Original**: SQLite via `tauri-plugin-sql` as the primary store for wiki entries, with structured columns (category, tags, status, etc).

**Why changed**: notes are heterogeneous files - markdown, PDFs, Word docs, Excel, URL bookmarks. SQLite's schema model fits atomic structured entries but not arbitrary file types. Filesystem is the universal substrate.

**New model**:
- Filesystem = source of truth: `projects/<slug>/{raw,wiki,outputs}/`
- SQLite (optional) = index/cache for fast search, rebuildable from the filesystem
- No lock-in: if you stop using CCCT, your notes are still plain files openable in any editor

### Pivot 4 - MCP first, REST optional

**Original**: REST API as the primary AI integration, Express sidecar bound to localhost.

**Why changed**: REST bound to 127.0.0.1 is still reachable by any local process. MCP via stdio is auth-by-process - only the spawning client (Claude Desktop, Claude Code) can talk to it. Better security profile, simpler setup, native to the Claude ecosystem.

REST remains a possible add-on if non-Claude AIs need access, but with explicit auth tokens - not as the default integration.

### Pivot 5 - Don't rebuild the filesystem

**Original**: full UI for browsing, editing, organizing files.

**Why scoped down**: VS Code, Obsidian, File Explorer, and git already do file editing, browsing, and version control better than any custom Tauri app could. Building competing versions = guaranteed worse quality + maintenance burden + duplicated work.

CCCT's job is to add **structural value** - things the filesystem doesn't natively understand: cross-project queries, project-aware layouts, AI-accessible search, structured metadata for wiki entries. Everything else punts to existing tools.

### Pivot 6 - "Google Drive for AI" framing

The clearest articulation of what v2 actually is: a local-first, structured filesystem layer that AI agents can read consistently across multiple human-curated projects. Not novel as a category - filesystem MCP servers, Obsidian, etc. exist - but the specific gap is *cross-project intelligence with structural awareness*, which existing tools do not address.

---

## Final architecture (Path B)

```
projects/                         ← user's filesystem, observed by CCCT
  ccct/
    raw/                          ← session JSONLs, pasted logs, source PDFs
    wiki/                         ← curated notes (md, pdf, urls, etc)
    outputs/                      ← generated artifacts (context transfers, summaries)
  job-search-2026/
    raw/
    wiki/
    outputs/
  ...

CCCT desktop app (Tauri)          ← human UI
  - Project browser (cross-project layout)
  - Cross-project search
  - Structured CRUD for wiki entries (templates, frontmatter, tags)
  - v1 features preserved: session reader, context transfer

MCP server                        ← AI integration
  - list_projects
  - search_notes (across projects)
  - read_file
  - create_wiki_entry
  - (more added as needed)

Optional: SQLite index            ← search cache, rebuildable from filesystem
Optional: REST sidecar            ← only if non-Claude AIs need access
```

---

## Tool division

CCCT does the things that benefit from project/structural awareness. Everything else punts to existing tools.

| Action | Tool | Rationale |
|---|---|---|
| Create wiki entry (filename, frontmatter, template) | **CCCT** | Knows what a wiki entry is |
| Edit note body / prose markdown | **VS Code / Obsidian** | Mature editors, no point competing |
| Edit metadata (category, tags, status) | **CCCT** | Structured fields, UI controls beat YAML editing |
| Browse one project's files (raw flat list) | **File Explorer** | Native, fast, already exists |
| Browse projects with structural overview (counts, recent activity, layout) | **CCCT** | Project-aware view, not just a file list |
| Search within a single file | **Editor** | Ctrl-F is everywhere |
| Search across one project's files | **CCCT or ripgrep** | CCCT for UI access, ripgrep for CLI |
| Search across **all** projects | **CCCT** | The headline cross-project feature |
| Delete with confirmation / soft delete to trash | **CCCT** | Project-scoped trash; OS recycle bin is global |
| Move / rename a file (preserving links) | **CCCT** | Only if links/references need to be preserved |
| Generic file move/rename | **File Explorer** | OS does this fine |
| Drag-drop external file into a project | **CCCT** | Auto-routes to `raw/`, optionally indexes |
| Save URL as a note | **CCCT** | No native filesystem affordance |
| Version history / diff | **git** | Don't reinvent |
| Preview PDF / image / video | **OS / native app** | Double-click works |
| Read notes from AI in Claude Desktop / Claude Code | **MCP server** | Stdio transport, auth-by-process |
| Read notes from non-Claude AI | **REST sidecar** (optional) | Token-authed, opt-in |
| Cloud sync / sharing | **Dropbox / Drive / git remote** | If needed at all |
| Generate context transfer prompt | **CCCT** (v1 feature, preserved) | Project-aware, uses wiki + sessions |
| Per-session TLDR / summary | **CCCT** (preserved, deprioritized) | Useful but no longer headline |

---

## Build constraints

- **Time-box**: 2 weekends for MVP. Scope is wrong if it grows beyond that.
- **MVP scope**: project list view + cross-project search + MCP server (3-4 read tools + create_wiki_entry). Nothing else.
- **No new features post-MVP** unless real daily use surfaces real friction.
- **Document the journey** before building further. This file is part of that.

---

## What stays from v1

- Tauri + React + TypeScript stack
- Session JSONL parser
- Conversation viewer
- Context transfer prompt generation
- Settings panel (Claude dir path, API key in keychain)

These features are preserved and integrate into the new architecture as one of several possible inputs to the notes pile, rather than as the central feature.

---

## What's preserved as historical record

- [docs/v1/](../v1/) - shipped v1 design and tracker
- [docs/v2/](../v2/) - original v2 plan, marked as superseded
- [docs/v2/CONTEXT_ARCHITECTURE_NOTES.md](../v2/CONTEXT_ARCHITECTURE_NOTES.md) - earlier alternative analysis (nodes/RAG vs skill folders); informed but didn't decide the final pivot
- This file - the actual scoping decision

---

## Open questions

- **Index strategy**: SQLite cache vs. on-demand ripgrep across the filesystem. Defer until search latency is felt.
- **Frontmatter format**: YAML vs TOML vs JSON for wiki entry metadata. Defer until first wiki entry is written.
- **MCP tool surface**: minimum useful tools. Start with 4, add only when missing one creates real friction.
- **v3 docs structure**: whether to write a clean `docs/v3/` set replacing v2, or evolve v2 with a "superseded" marker. Defer until MVP is built - design docs after the code is more honest than design docs before.
