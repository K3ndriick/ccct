# Path B - Coded Solution (Not Built)

**Status**: Designed but not built. See [why-we-didnt-build-v2.md](why-we-didnt-build-v2.md) for the decision rationale.

This document captures what CCCT v2 *would have been* if we'd chosen to ship a coded solution. It exists as a design archive, not a build spec.

---

## What Path B is

A small Tauri desktop app + MCP server that adds a **cross-project intelligence layer** on top of filesystem-stored notes.

The premise: AI agents (Claude Code, Claude Desktop, others) need consistent, structured access to a user's notes across multiple projects. The filesystem stores the notes, but doesn't natively understand "project," "wiki entry," "category," or "cross-project query." Path B adds that semantic layer without replacing the filesystem.

It is **not** a re-skinned file manager, a markdown editor, or a cloud sync tool. Those are punted to existing tools (File Explorer, VSCode/Obsidian, Dropbox/Drive/git).

---

## Architecture

### Storage model

```
~/notes/projects/                 ← user's filesystem, observed by CCCT
  ccct/
    raw/                          ← session JSONLs, pasted logs, source PDFs
    wiki/                         ← curated notes (md, pdf, urls, etc)
    outputs/                      ← generated artifacts (context transfers, summaries)
  job-search-2026/
    raw/
    wiki/
    outputs/
  ...
```

- Filesystem is the **source of truth**. Notes live as plain files.
- No lock-in: if CCCT is uninstalled, all notes remain openable in any editor.
- 3-folder convention per project (`raw/`, `wiki/`, `outputs/`) inspired by Karpathy's LLM Wiki pattern.

### Components

```
CCCT desktop app (Tauri + React + TypeScript + Rust)
  - Project browser: cross-project layout, counts, recent activity
  - Cross-project search UI
  - Structured CRUD for wiki entries (templates, frontmatter, tags)
  - v1 features preserved: session reader, context transfer prompt

MCP server (stdio transport)
  - Primary AI integration
  - Tools exposed: list_projects, search_notes, read_file, create_wiki_entry
  - Auth-by-process: only the spawning client (Claude Desktop, Claude Code) can talk to it

Optional: SQLite index
  - Search cache, rebuildable from filesystem
  - Not the source of truth - just a speed optimization

Optional: REST sidecar
  - Token-authed, opt-in only
  - For non-Claude AI tools that don't support MCP
```

### Why MCP over REST as the primary integration

| Aspect | REST (HTTP localhost) | MCP (stdio) |
|---|---|---|
| Network exposure | Bound to 127.0.0.1, but any local process can hit it | None - only the spawning process talks to it |
| Auth | Needs tokens; without them, any local app reads your notes | Inherent - process boundary is the auth |
| Setup | One config per AI tool | Native to Claude Desktop / Code |
| Efficiency | HTTP per request | Direct stdio |

REST stays as an opt-in fallback for the case where a non-Claude AI needs access. MCP is the default.

### Why filesystem-first, not SQLite-first

Notes are heterogeneous: markdown, PDFs, Word docs, Excel, URL bookmarks. SQLite's schema model fits atomic structured entries but not arbitrary file types. Filesystem is the universal substrate, openable by any editor, version-controllable with git, syncable with any cloud tool.

SQLite would have been wrong as the primary store. Optional as an index - fine.

---

## Tool division

CCCT does the things that benefit from project/structural awareness. Everything else punts to existing tools.

| Action | Tool | Why that tool |
|---|---|---|
| Create wiki entry (filename, frontmatter, template) | **CCCT** | Knows what a wiki entry is |
| Edit note body / prose markdown | **VSCode / Obsidian** | Mature editors, no point competing |
| Edit metadata (category, tags, status) | **CCCT** | Structured UI controls beat hand-editing YAML |
| Browse one project flat | **File Explorer** | Native, fast, already exists |
| Browse all projects with structural overview | **CCCT** | Project-aware view, no equivalent in File Explorer |
| Search within a single file | **Editor** | Ctrl-F is everywhere |
| Search across one project | **CCCT or ripgrep** | UI vs. CLI |
| Search across **all** projects | **CCCT** | Headline cross-project feature |
| Delete with project-scoped trash | **CCCT** | OS recycle bin is global |
| Generic file move/rename | **File Explorer** | OS does it fine |
| Move/rename preserving wiki links | **CCCT** | Only when references matter |
| Drag-drop external file into a project | **CCCT** | Auto-routes to `raw/`, optionally indexes |
| Save URL as a note | **CCCT** | No native filesystem affordance |
| Version history / diff | **git** | Don't reinvent |
| Preview PDF / image / video | **OS / native app** | Double-click works |
| Read notes from Claude Desktop / Code | **MCP server** | Stdio, auth-by-process |
| Read notes from non-Claude AI | **REST sidecar** (optional) | Token-authed, opt-in |
| Cloud sync / sharing | **Dropbox / Drive / git remote** | If needed at all |
| Generate context transfer prompt | **CCCT** (v1, preserved) | Project-aware, uses wiki + sessions |

---

## MVP scope (2 weekends, time-boxed)

If Path B were built, the MVP would be small enough to finish in a weekend or two. Anything more is the wrong scope.

**Build:**
- Tauri shell with project list view (read filesystem, show `~/notes/projects/`)
- Cross-project search (ripgrep wrapped in a Rust command, surfaced in UI)
- MCP server with 4 tools: `list_projects`, `search_notes`, `read_file`, `create_wiki_entry`
- Wiki entry creation flow (template + frontmatter + auto-filename)

**Don't build:**
- Markdown editor (use VSCode)
- File browser for arbitrary files (use File Explorer)
- Dashboard / charts (premature)
- AI audit pipeline (dropped - see scoping doc)
- SQLite index (defer until search is slow)
- REST sidecar (defer until non-Claude AI is needed)
- Per-session summaries (defer)

**Stop and re-cut if** the MVP isn't done in 2 weekends. That means scope is wrong.

---

## What Path B adds over Path A (existing tools)

The honest gap analysis:

| Capability | Path A (existing tools) | Path B (CCCT v2) |
|---|---|---|
| Store notes | folders | folders (same) |
| Edit notes | VSCode/Obsidian | VSCode/Obsidian (same) |
| Backup / version | git + GitHub | git + GitHub (same) |
| AI access from Claude Code | `cd ~/notes && claude` | via MCP |
| AI access from Claude Desktop | No - requires MCP setup |  MCP built-in |
| Search within one project | ripgrep / VSCode | Yes |
| Search across projects |  ripgrep works but no project-aware UI | Yes |
| Project-aware overview | No | Yes |
| Templated wiki entries | Obsidian/VSCode templates work | Yes |
| Cross-project AI queries with structure | AI sees raw files, no project semantics | Yes |

The gap is real but small. ~85% of the value is covered by Path A.

---

## Why this wasn't built

Five reasons, in priority order:

1. **Existing tools cover ~85% of the value** for the user's actual workflow (Claude Code primary, occasional Claude Web).
2. **The 15% gap (cross-project structural queries) is theoretical**, not yet felt in real use. Building before feeling the pain risks shipping a tool no one - including the user - uses.
3. **MCP isn't needed yet**: Claude Code's cwd-based access pattern (`cd ~/notes && claude`) provides cross-project access without any custom server.
4. **Maintenance cost is non-zero**: a Tauri app + MCP server requires upkeep. With the user as the only consumer, that cost is paid for marginal value.
5. **The portfolio artifact is stronger as a writeup**: documenting the decision *not to build* is rarer and more senior-coded than shipping yet another notes tool.

---

## What would tip the decision toward building

Path B becomes worth building if any of these become true:

- User adopts Path A for 2-3 weeks and the cross-project gap is *consistently* annoying (not theoretically annoying)
- A second AI tool enters the workflow that doesn't have Claude Code's cwd-based filesystem access (and MCP setup is needed often enough to warrant a UI)
- A second human user (e.g., a teammate) wants access to the same notes pile with structural semantics
- Project count grows past ~10, where cross-project search via ripgrep becomes too noisy

Until at least one of these is true, Path A is sufficient.

---

## Status

Designed, not built. This document and the decision doc are the deliverables. v1 remains shipped as the working artifact demonstrating the implementation skills.
