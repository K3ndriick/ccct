# Path A - Existing Tools (Recommended)

**Status**: Recommended workflow. See [why-we-didnt-build-v2.md](why-we-didnt-build-v2.md) for the decision rationale and [v2-design-archive.md](v2-design-archive.md) for the alternative we chose not to build.

This document describes the actual recommended setup: folders, git, an editor, and Claude Code. No CCCT v2 needed.

---

## Why Path A is the recommendation

Path A solves ~85% of what CCCT v2 was supposed to solve, with:
- $0 cost
- ~1 afternoon of setup
- No tool to maintain
- No lock-in (notes are plain files)
- All tools mature and battle-tested

The remaining ~15% gap is the cross-project structural intelligence layer - and that gap is theoretical until felt in real daily use. Build only if the gap becomes a real friction point. See Path B for that case.

---

## Path A (minimal)

The minimum viable stack - no custom servers, no MCP, no CCCT.

### The stack

| Layer | Tool | Cost |
|---|---|---|
| Storage | Folders on disk | $0 |
| Backup / version control | git + private GitHub repo | $0 |
| Editing | VSCode (or Obsidian for backlinks/graph view) | $0 |
| AI access | Claude Code (terminal) | usage-based |
| One-shot AI tasks | Claude Web (drag-drop files) | usage-based |
| Cross-folder search | ripgrep / VSCode search | $0 |

### Folder layout

```
~/notes/
├── .git/                        ← version control for the entire notes pile
├── .gitignore
├── README.md                    ← brief index of projects + conventions
├── projects/
│   ├── ccct/
│   │   ├── raw/                 ← session JSONLs, source PDFs, pasted logs
│   │   ├── wiki/                ← curated notes (md, pdf, urls, etc)
│   │   │   ├── PRD.md
│   │   │   ├── ARCHITECTURE.md
│   │   │   ├── decisions/
│   │   │   └── memory.md
│   │   └── outputs/             ← generated artifacts (transfers, summaries)
│   ├── job-search-2026/
│   │   ├── raw/                 ← job descriptions, recruiter emails
│   │   ├── wiki/                ← resume, story bank, target list
│   │   └── outputs/
│   └── kitchen-reno/
│       ├── raw/
│       ├── wiki/
│       └── outputs/
└── shared/                      ← cross-project notes (skills, contacts, etc)
    └── wiki/
```

The 3-folder pattern (`raw/`, `wiki/`, `outputs/`) is convention, not enforced. The discipline is yours, not the tool's.

### Setup steps

1. **Create the structure**
   ```bash
   mkdir -p ~/notes/projects ~/notes/shared/wiki
   cd ~/notes
   git init
   ```

2. **Write a top-level `~/notes/README.md`** describing your conventions:
   - What goes in `raw/` vs `wiki/` vs `outputs/`
   - How you name files (e.g. `YYYY-MM-DD-topic.md`)
   - Tag conventions if any (frontmatter or inline)

3. **Create a private GitHub repo and push**
   ```bash
   gh repo create notes --private --source=. --push
   ```

4. **Open in VSCode** (or Obsidian if you want backlinks):
   ```bash
   code ~/notes
   ```

5. **For Obsidian**: open `~/notes/` as a vault. Each `projects/<slug>/` is browsable in the sidebar.

### How to use it

**Daily AI workflow with Claude Code:**

```bash
# Cross-project context - Claude can see all projects
cd ~/notes && claude

# Single-project context - Claude only sees one project
cd ~/notes/projects/ccct && claude

# Single-project but with relevant cross-project notes - copy or symlink them in
cd ~/notes/projects/job-search-2026
ln -s ../ccct/wiki/decisions ./referenced-decisions
claude
```

Inside the session, Claude has Read/Glob/Grep tools and can navigate the folder structure naturally.

**Example prompts:**
- "Read the wiki for the ccct project and summarize the architecture decisions."
- "I'm drafting a resume bullet for a backend role. Look at projects/ccct/wiki/ARCHITECTURE.md and projects/ccct/wiki/decisions/ - find concrete technical decisions I made and propose 2-3 bullet phrasings."
- "Make a note in projects/ccct/wiki/decisions/ summarizing what we decided in this session."

**Capturing notes during a session:**

Tell Claude directly: *"Make a note of this in projects/ccct/wiki/."* Claude writes the file. You review and commit when convenient.

**Backing up:** `git commit -am "..." && git push` whenever a meaningful change happens. No automation needed unless you want it.

### Claude Web (for one-shot tasks)

When you need something quick and don't want to fire up a terminal:
- Drag-drop the relevant `.md` files into a Claude.ai conversation
- Or paste content directly
- Tradeoff: files leave your machine, conversation is on Anthropic's servers
- For sensitive notes (e.g. salary research), prefer Claude Code locally

### What this gets you

- Storage ✓
- Editing ✓
- Backup + version history ✓
- Cross-project AI access (via cwd) ✓
- Single-project AI access ✓
- Plain-file portability ✓
- Cross-project search (via ripgrep / VSCode) ✓ (without project-aware UI)

---

## Path A+ (with MCP)

The same stack, plus an MCP server for AI access from tools that don't already have filesystem access (Claude Desktop, claude.ai with MCP support, future non-Claude clients).

### When MCP earns its keep

MCP is **not** needed if your only AI tool is Claude Code, because Claude Code already has filesystem access via its built-in tools. Adding MCP on top of Claude Code is redundant.

MCP becomes worth setting up when **any** of these are true:

1. **You use Claude Desktop / claude.ai chat UI** for serious work, not just one-shot tasks. Without MCP, the chat UI has no filesystem; with MCP, it does.
2. **You want scoped access** - e.g., expose only `projects/ccct/wiki/` to Claude Desktop, not the whole `~/notes/` pile.
3. **You want write protection** - MCP can be configured read-only, where Claude Code's cwd access is read+write.
4. **You add a non-Claude AI tool** that supports MCP (Cursor, Continue.dev, etc).

If none of these are true, skip MCP and stay on Path A minimal.

### What MCP adds

- **Persistent filesystem access** for chat-UI clients (Claude Desktop, claude.ai)
- **Scoped exposure**: choose which folders/tools the AI sees
- **Auth-by-process**: only the spawning client talks to it, no open port
- **Tool customization**: optionally add domain-specific tools (e.g. `find_decisions`, `list_open_questions`)

### Setup with Anthropic's official filesystem MCP server

1. **Install** (Claude Desktop on Windows, edit config file):

   Open `%APPDATA%\Claude\claude_desktop_config.json` and add:
   ```json
   {
     "mcpServers": {
       "notes": {
         "command": "npx",
         "args": [
           "-y",
           "@modelcontextprotocol/server-filesystem",
           "C:\\Users\\<you>\\notes"
         ]
       }
     }
   }
   ```

2. **Restart Claude Desktop**.

3. **Verify**: in a new conversation, ask Claude "list the projects in my notes folder." It should use the filesystem MCP tools to enumerate `~/notes/projects/`.

For Claude Code with MCP (rare, since cwd access usually suffices), see Anthropic's MCP setup docs.

### Security tradeoffs

| Concern | Path A (cwd) | Path A+ (MCP) |
|---|---|---|
| Network exposure | None | None (stdio transport) |
| What can read your notes | Whatever you `cd` into | Only the spawning client |
| Scope control | All of cwd is visible | Configurable - can restrict to subfolders |
| Write access | Full write to cwd | Configurable - can be read-only |
| Auth | Process-level (you started Claude Code) | Process-level (Claude Desktop spawned MCP) |

Both are reasonably safe for single-user local use. MCP is slightly more controllable; Path A is simpler.

**Avoid REST**: a localhost HTTP server is reachable by any process on your machine, including malicious code. If you ever expose notes via HTTP, require an auth token. For most users, MCP via stdio is the right choice over REST.

---

## What you give up vs. Path B

| Capability | Path A | Path A+ | Path B (CCCT v2) |
|---|---|---|---|
| Storage / editing / backup | Yes | Yes | (same - filesystem-first) |
| AI access (Claude Code) | via cwd | via cwd | via MCP |
| AI access (Claude Desktop) | No | via MCP | via MCP |
| Cross-project search | ripgrep only | ripgrep only | project-aware UI |
| Project-aware overview | No | No | Yes |
| Templated wiki entries | via editor templates | via editor templates | Yes |
| Structural CRUD UI | No | No | Yes |
| Cross-project AI queries with semantics | AI sees raw files | AI sees raw files | Yes |

The gap is small but real. Live with Path A or Path A+ until the gap consistently bites in real use. Then revisit Path B.

---

## Migration from current state

Right now this repo (`ccct`) contains:
- v1 source code (Tauri app for Claude Code session viewing + context transfer)
- v1 docs in `docs/v1/`
- v2 plan docs in `docs/v2/` (superseded)
- Decision docs in `docs/decisions/` (this file lives here)

To move into the Path A workflow:

1. **Decide where `~/notes/` lives.** A new repo at `~/notes/`, separate from `~/projects/new/ccct/`.

2. **Create the structure** (commands above).

3. **Migrate this project's docs**: copy `docs/v1/`, `docs/v2/`, `docs/decisions/` into `~/notes/projects/ccct/wiki/` so the ccct project's brain is part of the notes pile.

4. **Migrate other projects' notes** as you have them. Job applications, resume drafts, anything else.

5. **Test with Claude Code**: `cd ~/notes && claude`, ask it to summarize what it sees across projects. Verify cross-project access works as expected.

6. **Decide if MCP is worth setting up** based on the criteria above. Probably skip initially.

7. **Use it for 2-3 weeks**. Note any friction points in `~/notes/projects/ccct/wiki/path-a-feedback.md`. After 3 weeks, decide:
   - Friction is theoretical → Path A is fine, archive CCCT v1
   - Friction is real and recurring → revisit Path B with concrete evidence

---

## Conventions to consider (optional)

These are personal-discipline things. Not enforced by tools, but worth deciding upfront:

- **File naming**: `YYYY-MM-DD-topic.md` for dated entries; `Topic.md` for evergreen
- **Frontmatter**: YAML at the top with `category`, `tags`, `status` (draft/confirmed) - useful if you ever want to add an index later
- **Linking**: relative markdown links between files; Obsidian-style `[[wikilinks]]` if using Obsidian
- **Categories**: decision / failed-attempt / open-question / note (the Karpathy-style buckets) - or whatever fits your domain
- **Commit cadence**: commit when you finish a thought, not on a timer; `~/notes/` history is your audit trail

None of this is required. Add it if and when it helps.

---

## Status

This is the active recommended workflow. The minimum stack (Path A, no MCP) covers the daily use case. Add MCP (Path A+) only when a second AI client enters the workflow.
