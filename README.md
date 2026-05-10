# CCCT - Claude Code Context Transfer

A desktop app for browsing Claude Code conversation history and generating continuation prompts to carry context across sessions.

> **Status**: v1 shipped. v2 designed but intentionally not built - see [the decision doc](docs/decisions/why-we-didnt-build-v2.md). This repo preserves both the working v1 artifact and the design analysis that led to *not* shipping v2.

---

## TL;DR

- **v1** - a working Tauri desktop app that reads `~/.claude/projects/**/*.jsonl`, renders sessions in a clean three-panel UI, and generates an Anthropic-API-powered continuation prompt. Shipped, builds to a Windows `.msi` installer.
- **v2** - was originally planned as a 6-sprint expansion (SQLite-backed wiki, AI audit pipeline, dashboard, REST API). Stress-testing the design surfaced that ~85% of v2's value was already covered by existing tools (folders + git + VSCode + Claude Code's built-in filesystem access). Decision: don't build it.
- **Recommended workflow** - Path A: a folder convention, GitHub for backup, an editor of choice, and Claude Code with cwd-based filesystem access. See [recommended-workflow.md](docs/decisions/recommended-workflow.md).

---

## The journey

This project was as much an exercise in deciding what *not* to build as in building.

1. **v1 was built.** Inspired by an open-source Claude Code session viewer, with the addition of an AI-powered context transfer prompt generator. Full feature list and architecture in [docs/v1/](docs/v1/).

2. **v2 was planned.** A 6-sprint roadmap turning v1 into a project knowledge layer - SQLite wiki, AI audit extraction, dashboard charts, REST API. Plan in [docs/v2/](docs/v2/).

3. **v2 was stress-tested.** Multiple alternative framings were considered (nodes/RAG, skill folders, Karpathy's 3-folder pattern, "Google Drive for AI"). Each surfaced gaps in the original v2 plan.

4. **v2 was rescoped, then dropped.** The honest analysis: existing tools (folders + GitHub + VSCode/Obsidian + Claude Code) cover ~85% of what v2 was meant to do, with $0 setup cost and no maintenance burden. The remaining ~15% gap (cross-project structural intelligence) is theoretical until felt in real daily use.

5. **The decision was documented.** Three docs in [docs/decisions/](docs/decisions/) capture: the scoping decision, the recommended workflow (Path A), and the design we chose not to build (Path B).

The portfolio artifact is the combination of v1 (proof of execution) and the decision docs (proof of judgment). Building v2 would have been a worse use of the same time.

---

## Repo layout

```
ccct/
├── src/                        # v1 React + TypeScript frontend
├── src-tauri/                  # v1 Rust backend
├── docs/
│   ├── v1/                     # v1 design and tracker (shipped)
│   ├── v2/                     # v2 plan (superseded, preserved as historical record)
│   └── decisions/              # scoping decision and path docs
│       ├── why-we-didnt-build-v2.md
│       ├── recommended-workflow.md     # recommended workflow
│       └── v2-design-archive.md        # design archive of what we didn't build
└── README.md                   # this file
```

---

## v1 - what shipped

A three-panel Tauri desktop app:

- **Sidebar** - projects and sessions discovered from `~/.claude/projects/`, indexed on first launch and incrementally updated thereafter
- **Conversation view** - clean rendering of user/assistant messages, tool calls (Read/Write/Edit/Bash/Glob), thinking blocks, and diffs
- **Output panel** - one-click generation of a structured continuation prompt via the Anthropic API, copyable to clipboard

Other v1 features:
- Settings panel with auto-detected Claude directory
- API key stored in OS keychain (Windows credential manager)
- Auto-index on app open
- Builds to a working `.msi` installer

Stack: Tauri 2, React 19, TypeScript 5.9, Vite 7, Tailwind CSS v3, Rust.

Full v1 design and architecture: [docs/v1/](docs/v1/).

---

## v2 - what was planned and why we didn't build it

The original v2 plan added a per-project wiki (SQLite), AI audit extraction, dashboard, per-session summaries, wiki-aware context transfer, and a local REST API. Six sprints of work.

Three things killed the build decision:

1. **Notes are heterogeneous** (md, PDF, URLs, Excel) - SQLite as a primary store fits atomic structured entries, not arbitrary file types. Filesystem-first is the right model.

2. **Existing tools cover ~85% of the value** - Claude Code's cwd-based filesystem access provides cross-project AI access without any custom server. VSCode/Obsidian handle editing. git handles version history.

3. **The gap is theoretical, not felt** - building before the cross-project intelligence gap actually bites in real use risks shipping a tool nobody uses.

The full analysis: [docs/decisions/why-we-didnt-build-v2.md](docs/decisions/why-we-didnt-build-v2.md).

The design we chose not to build (preserved as a design archive): [docs/decisions/v2-design-archive.md](docs/decisions/v2-design-archive.md).

---

## Recommended workflow (Path A)

If you have the same problem - multiple projects with notes, AI agents that need cross-project access - the recommended setup is:

```
~/notes/
├── .git/
├── projects/
│   ├── <project-slug>/
│   │   ├── raw/      # source material (sessions, PDFs, pasted logs)
│   │   ├── wiki/     # curated notes
│   │   └── outputs/  # generated artifacts
│   └── ...
```

Then:
- `cd ~/notes && claude` for cross-project AI access
- VSCode or Obsidian for editing
- git + private GitHub repo for backup

That's the whole stack. Setup time: an afternoon. Cost: $0.

Full setup guide and conventions: [docs/decisions/recommended-workflow.md](docs/decisions/recommended-workflow.md).

---

## Building v1 locally

> **Note**: A distributable installer is not yet available. Running from source requires a local dev environment. A packaged release is planned.

Prerequisites: Node.js, Rust, Tauri 2 prerequisites for your platform.

```bash
npm install
npm run tauri dev      # development
npm run tauri build    # production build (Windows)
```

For development, set `VITE_ANTHROPIC_API_KEY` in `.env` (gitignored). For production, the API key is read from the OS keychain via the Settings panel.

---

## Credits

v1 was inspired by an existing open-source Claude Code session viewer. CCCT's contribution over that inspiration was the Anthropic-API-powered context transfer prompt feature.

Built as a personal project to learn Tauri + Rust + the Anthropic API, and as a portfolio piece demonstrating end-to-end product engineering - including the judgment to stop building when the cost-benefit shifts.

---

## License

Copyright (c) 2026 Kendrick Lee (K3ndriick). All Rights Reserved. See [LICENSE](LICENSE) for details.
