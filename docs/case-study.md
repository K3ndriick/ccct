# CCCT Engineering Case Study

> A narrative walkthrough of CCCT from problem to build to decision not to build v2.
> Audience: recruiters and technical interviewers who want the full story in one place.

---

## 1. The Problem

Claude Code saves every conversation as a raw `.jsonl` file - one JSON object per line. The files are named with UUIDs, stored in a deeply nested directory, and contain everything mixed together: user messages, assistant responses, tool calls, tool results, thinking blocks, session plumbing, and base64-encoded content. There is no built-in way to browse them, search them, or read them as a conversation.

The more painful problem was context loss. When a session ends - whether by hitting context limits, starting a fresh terminal, or picking up work the next day - there is no structured way to carry decisions, progress, and next steps into a new session. `claude --resume` helps for simple cases but fails entirely when context limits have been hit. The alternative is manually re-explaining the project from scratch, every time.

This problem is felt most acutely by Claude Code power users working on longer projects across multiple sessions - anyone who has said "wait, why did we decide to do it this way?" two sessions later.

---

## 2. Why Build Instead of Use an Existing Tool

An open-source Claude Code history viewer (CCHV) existed at the time and handled the session viewing problem reasonably well. CCCT was built partly as a learning challenge on top of that foundation - building a viewer from scratch to understand the format - but the real differentiator was never the viewer.

The gap was the continuation problem. No existing tool - not CCHV, not `claude --resume`, not copy-pasting the last few messages - generated a structured, AI-powered summary of a session designed to be pasted into a new one. That specific workflow did not exist anywhere. CCCT's context transfer prompt was the differentiator, not the session viewer.

Building it was also a deliberate learning opportunity: Tauri, Rust, the Anthropic API, and end-to-end desktop app development were all new territory.

---

## 3. What Was Built (v1)

CCCT is a Tauri desktop app for Windows that reads Claude Code session files from disk and generates an AI-powered continuation prompt for carrying context into a new session. It is 100% local - no data is sent anywhere except the Anthropic API when the user explicitly triggers generation.

Three panels:

**Sidebar** - discovers all Claude Code projects and sessions from `~/.claude/projects/`, indexes them in AppData on first launch and incrementally on subsequent opens, and renders them as a browsable list organized by project.

**Conversation view** - renders a selected session as a clean chat interface: user messages, assistant text, tool calls (Read, Write, Edit, Bash, Glob) with their inputs and results, thinking blocks, and diffs for edit operations. Noise (queue operations, file history snapshots, base64 content) is filtered out.

**Output panel** - generates a structured continuation prompt via the Anthropic API from the selected session. The prompt is designed to be pasted into a new Claude Code session to restore context without re-explaining the project from scratch. One click copies it to clipboard.

Additional v1 features: Settings panel with auto-detected Claude directory, API key stored in Windows Credential Manager (never in a plaintext file), auto-index on app open.

**The hardest technical problem** was the JSONL parser. Claude Code's session format has no official documentation. The structure was reverse-engineered entirely from real session files - understanding which fields are reliable, how tool calls are linked to their results via `tool_use_id`, how thinking blocks are nested inside assistant content arrays, which record types to filter, and how metadata (model, session ID, working directory) is scattered across the first few records. The parser handles all of this as pure TypeScript against a discriminated union type system.

**A non-obvious design decision**: the parser was written in TypeScript rather than Rust, despite the app having a Rust backend. Rust handles only what requires native OS access (filesystem reads, keychain, AppData paths). The parser is pure data transformation and lives in TypeScript alongside the types it produces - no serialization boundary, faster iteration, and no need to maintain matching type definitions in two languages. See ADR-003.

---

## 4. The Stack and Why

- **Tauri 2** over Electron: Windows-only target removes Electron's main advantage (cross-platform), and Tauri's use of WebView2 (pre-installed on Windows 10/11) means no bundled Chromium and a much smaller installer. See ADR-001.
- **Rust backend**: required by Tauri, kept intentionally thin - only native OS operations.
- **React 19 + TypeScript**: standard frontend stack, chosen for familiarity.
- **Tailwind CSS v3** with a custom warm dark design system (electric green accent, Inter + JetBrains Mono).
- **Anthropic API** (`claude-sonnet-4-6`) for the continuation prompt generation.
- Discriminated unions for `ToolCall` and `Message` types: TypeScript narrows on the `type`/`role` field, so accessing `.command` on a Read tool call is a compile error. See ADR-002.
- **OS keychain** for API key storage via the `keyring` Rust crate: the key is stored in Windows Credential Manager and never written to disk. See ADR-004.

---

## 5. What Was Learned Building v1

The JSONL parser was the biggest surprise. The assumption going in was that parsing structured data would be mechanical work - a few hours at most. It took significantly longer because there was no reference implementation, no documentation, and the format had several non-obvious properties: tool results are separate records that reference tool calls by ID across turns, thinking blocks appear as a specific `content` array variant, some records are duplicated across sidechain sessions that need to be filtered, and metadata is not in a header but scattered across the first meaningful records.

The lesson was that "parsing structured data" is easy when you have a schema. Reverse-engineering the schema from production data is a different problem.

---

## 6. v2 Was Planned - Then Wasn't Built

The original v2 plan was to turn CCCT into a project intelligence layer: a SQLite-backed wiki per project, an AI audit pipeline to extract decisions and failed approaches from sessions, a dashboard with charts, per-session summaries, wiki-aware context transfer, and a REST API for AI tools to query the knowledge base. Six sprints of planned work.

The premise was put through multiple rounds of stress testing - measured against alternatives proposed by experienced engineers and against existing tools in the space. Each round of that analysis did something unexpected: it consistently confirmed that the underlying problem (context intelligence management across sessions and projects) was real and worth solving. But it just as consistently revealed that building a custom desktop app was the wrong way to solve it.

The pivots were cumulative:

**Round 1 - "Just use Copilot"**: established that decision history and code context are different things. Copilot indexes code. CCCT needed to index *why* decisions were made, not where functions are defined. The problem was validated.

**Rounds 2-4 - "Just use filesystem / VS Code / Obsidian"**: each round stripped away a layer of the planned UI. Filesystem-equipped Claude covers session brief generation. VS Code covers file browsing and editing. Obsidian covers knowledge graph visualization. By round 4, the only thing that survived was the extraction engine itself - the part that converts unstructured sessions into structured knowledge records.

**The final pivot**: even the extraction engine approach was the wrong frame. The actual question was not "how do I build better tooling to manage context?" but "what workflow solves the underlying problem?" The answer was already available: a folder convention (`raw/`, `wiki/`, `outputs/` per project), git for backup, VSCode or Obsidian for editing, and `cd ~/notes && claude` for cross-project AI access. That stack costs nothing, requires no maintenance, and covers roughly 85% of what v2 was supposed to do.

The remaining 15% - cross-project structural intelligence, templated wiki entries, project-aware search - was theoretical. It had not been felt as a real daily friction point. Building before that friction is felt risks shipping a tool nobody uses, including yourself.

The hardest part of stopping was the question that came with it: was this being built to solve a real problem, or to have something to build? Once the stress testing made the answer honestly unclear, the decision followed.

The deepest conclusion from the whole process was not really about tools at all. It was about knowledge management as a discipline. The right answer to "how do I maintain context across AI sessions?" turns out to be mostly the same answer as "how do I maintain context across anything?" - build a habit of storing things well, know what is worth remembering vs what you can reconstruct, and use your own memory deliberately rather than outsourcing it entirely. AI helps, but sometimes it is genuinely faster to remember something yourself than to build a system to remember it for you. The tool-building instinct can be a way of avoiding that discipline rather than enabling it.

---

## 7. The Decision

v2 was not built. The three most decisive reasons:

1. **Existing tools cover the problem adequately.** Folders + git + VSCode/Obsidian + `cd ~/notes && claude` solve the context management problem without custom software, $0 setup cost, and no maintenance burden.

2. **The gap is theoretical, not felt.** The remaining capability that existing tools don't provide (cross-project structural intelligence, project-aware search) had not produced real friction in daily work. Building before the pain is felt means building for a hypothetical user.

3. **The portfolio artifact is stronger this way.** A documented, honest decision not to build is rarer and more senior-coded than another shipped features list. The decision docs are the deliverable, not the v2 codebase.

What would reverse the decision: using Path A (the existing tools workflow) for 2-3 months and finding the cross-project gap consistently annoying in real use - not theoretically annoying. That would be the evidence needed to justify building.

Path A in practice: a `~/notes/` folder with git, organized as `projects/<slug>/{raw,wiki,outputs}/`. `cd ~/notes && claude` for cross-project AI access. VSCode or Obsidian for editing. One afternoon to set up, nothing to maintain. Full setup in [docs/decisions/recommended-workflow.md](recommended-workflow.md).

---

## 8. What This Project Demonstrates

**Engineering**: end-to-end desktop app development (Tauri, Rust, React, TypeScript); reverse-engineering an undocumented file format under real constraints; discriminated union type design for a complex domain model; cross-language system design (deciding what belongs in Rust vs TypeScript); secure credential storage on Windows; building a working installer from a Rust + React stack.

**Product judgment**: defining scope and holding to it; running structured stress tests against your own work before committing to a build; documenting the analysis behind a decision not to ship; recognizing when an existing tool solves the problem better than a custom one; knowing when "good enough and maintainable" beats "custom and theoretically better."

To someone who asks "why didn't you just finish v2?": the question assumes that shipping more code is the right measure of success. The stress testing showed that v2 would have been the wrong product for the actual problem. Stopping and documenting why is a more useful output than a half-shipped wiki feature that nobody - including me - would have used.

---

## 9. Outcomes and Status

v1 is complete and works. The app successfully reads real Claude Code sessions, renders them cleanly, and generates usable continuation prompts. It has been used in daily work.


The repo is preserved as a portfolio artifact: v1 source code, v1 design and architecture docs, the original v2 plan (marked superseded), and the decision docs capturing the full analysis. The combination of a shipped v1 and a documented decision not to build v2 is the intended portfolio signal.

Next: building MCP Notes - a plain-text notes system with an MCP server - in a separate repo. That project is the practical outcome of the Path A analysis: instead of building a custom app, build the small piece of infrastructure (MCP server) that extends the existing tools workflow to cover the one gap that actually matters. The spec is in [docs/decisions/](../mcp_notes/mcp-notes-project.md).
