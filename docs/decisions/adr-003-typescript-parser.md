# ADR-003: JSONL Parser in TypeScript, not Rust

---

## Context

Claude Code stores every conversation as a `.jsonl` file - one JSON object per line. Each line is a raw record that may be a user message, an assistant message with tool calls and thinking blocks, a tool result, session metadata, or internal plumbing like queue operations and file history snapshots.

The parser's job is to take this raw file content and produce a clean, typed `ParsedConversation` object: filtered down to meaningful records, user and assistant messages separated, tool calls matched to their results, thinking blocks extracted, and metadata (session ID, model, timestamps, working directory) surfaced.

CCCT already had a Rust backend for filesystem access via Tauri. The question was whether the parser belonged there too, or in TypeScript on the frontend.

---

## Options Considered

### TypeScript (frontend)

Writing the parser in TypeScript meant it lived alongside the TypeScript types it produced. The `ParsedConversation`, `Message`, and `ToolCall` types are defined in `src/types/index.ts` and consumed directly by React components - keeping the parser in the same language meant no serialization boundary between the parsing output and the UI that renders it.

Iteration was also faster in TypeScript: no recompile cycle across the Rust/TypeScript boundary, direct console logging during development, and the ability to test against real `.jsonl` files without going through Tauri invoke calls.

The downside is performance headroom. TypeScript parsing is single-threaded and runs in the renderer process. For very large session files this could become a bottleneck, though in practice no session encountered during development caused a noticeable delay.

### Rust (backend, via Tauri command)

Parsing in Rust would have meant writing a Tauri command that accepted a file path, read the file, parsed the JSONL, and returned a serialized result to the frontend. Rust is genuinely fast for this kind of work and would have no problem with large files.

The practical cost: the parsed data would need to cross the Tauri command boundary as JSON, requiring the Rust types and TypeScript types to stay in sync manually. Any change to the data shape would require updating both. For a first Rust project, the added complexity of maintaining a serialization contract across two type systems was not worth the performance gain that was not yet needed.

---

## Decision

TypeScript. The decisive factors:

1. **No serialization boundary.** The parser output feeds directly into TypeScript types and React components. Keeping it in TypeScript eliminates a whole class of friction - mismatched types across the language boundary, serialization overhead, and the need to duplicate type definitions.
2. **Separation of concerns.** Rust handles what only Rust can do: reading from the Windows filesystem, accessing the OS keychain, writing to AppData. TypeScript handles everything that does not need native OS access. The parser is pure data transformation - it belongs in TypeScript.
3. **Learning curve.** Rust was new territory on this project. Implementing a non-trivial stateful parser (tool call matching, record filtering, metadata extraction) in Rust from scratch would have slowed down Phase 2 significantly without a clear benefit.

---

## Consequences

Performance has not been an issue. The largest real-world sessions parsed during development showed no noticeable delay in the UI.

The architecture held up cleanly: when the data shape needed to change (adding fields, adjusting how tool results were linked), it was a single TypeScript file to update with no cross-language coordination required.

What would tip this the other way: if session files grew large enough to block the renderer thread noticeably, moving parsing to a Rust command or a Web Worker would be the next step. Neither has been needed.
