# Architecture Diagrams

The canonical visual reference for CCCT v1, fact-checked against the shipped code (`src/`, `src-tauri/`).

- **Diagram 1 - System Architecture**: macro view of the components and the build decisions.
- **Diagram 2 - Data Flow / Pipeline**: micro view of how a session log becomes a context-transfer message.

For the React-level detail these diagrams don't cover (folder structure, component render tree, state ownership), see [`ARCHITECTURE.md`](ARCHITECTURE.md). The parser itself is [`src/lib/parser.ts`](../../src/lib/parser.ts).

---

## 1. System Architecture (macro view)

```mermaid
graph TB
    subgraph Desktop["Tauri Desktop App (single native binary)"]
        subgraph FE["React 19 + TypeScript Frontend (WebView2)"]
            UI["UI Components<br/>Sidebar - ConversationView - OutputPanel - Settings"]
            APP["App.tsx<br/>(state + orchestration)"]
            PARSE["parser.ts<br/>JSONL -> ParsedConversation"]
            INDEX["indexer.ts<br/>build / update cache"]
            ANTH["anthropic.ts<br/>Anthropic SDK client"]
        end

        subgraph BE["Rust Backend (thin - native OS only)"]
            CMD["#tauri::command handlers<br/>read_file - read_claude_dir<br/>get/set/delete_api_key<br/>get/save_settings - read/write_index"]
            KEYRING["OS Keyring<br/>(Windows Credential Manager)"]
        end

        IPC{{"Tauri IPC Bridge<br/>invoke() &lt;-&gt; serde JSON"}}
    end

    FS[("Filesystem<br/>~/.claude/projects/**/*.jsonl<br/>%APPDATA%/ccct/{settings,index}.json")]
    API(["Anthropic API<br/>messages.create - models.list"])

    UI --> APP
    APP --> PARSE
    APP --> INDEX
    APP --> ANTH
    INDEX --> PARSE

    APP <-->|"invoke()"| IPC
    IPC <--> CMD
    CMD --> FS
    CMD --> KEYRING

    ANTH <-->|"HTTPS direct from WebView<br/>(dangerouslyAllowBrowser)"| API

    classDef fe fill:#0f2a1a,stroke:#06d472,color:#e8f5ee
    classDef be fill:#2a1f0f,stroke:#d4a006,color:#f5efe8
    classDef ext fill:#1a1a2a,stroke:#6a6acc,color:#e8e8f5
    class UI,APP,PARSE,INDEX,ANTH fe
    class CMD,KEYRING be
    class FS,API ext
```

**Build decisions shown visually:**

- **Tauri over Electron** -> one native binary using the OS WebView2 instead of a bundled Chromium. See [ADR-001](../decisions/adr-001-tauri-over-electron.md).
- **Rust over Node** -> the backend box owns *only* native work (filesystem, keyring, persistence) and never parses. See [ADR-003](../decisions/adr-003-typescript-parser.md).
- The **IPC bridge** (`invoke()` <-> serde JSON) is the sole channel between frontend and backend; every privileged operation crosses it.
- The **Anthropic call goes directly from the WebView over HTTPS** (`dangerouslyAllowBrowser: true`), not through Rust.

---

## 2. Data Flow / Pipeline (micro view)

```mermaid
flowchart TD
    A[("JSONL session log<br/>append-only - one record per line<br/>~/.claude/projects/&lt;slug&gt;/&lt;session&gt;.jsonl")]

    A -->|"Rust read_file -> IPC<br/>(raw string only - no parsing)"| B["Raw string in frontend"]

    B --> P0["Split lines -> JSON.parse -> RawRecord[]"]
    P0 --> P1{"Filter records"}
    P1 -->|"drop"| X["queue-operation - progress - system<br/>file-history-snapshot<br/>isMeta - isSidechain"]
    P1 -->|"keep user / assistant"| P2["Extract metadata<br/>sessionId - cwd - model<br/>first/last timestamp"]

    P2 --> SM{{"Single-pass state machine<br/>(walk records in order)"}}

    subgraph TURN["Streaming grouping - 1 logical turn = N records sharing message.id"]
        direction TB
        ACC["Accumulate into 3 buckets:"]
        T1["currentTextBlocks[]"]
        T2["currentThinkingBlocks[]  &lt;- thinking is parsed &amp; retained"]
        T3["currentToolUseBlocks[]"]
        ACC --> T1 & T2 & T3
        FLUSH["flush() on turn boundary<br/>(new message.id OR a user record)<br/>-> emit AssistantMessage<br/>-> store tool_use in pendingToolCalls map"]
        T1 & T2 & T3 --> FLUSH
    end
    SM -->|"assistant record"| ACC

    SM -->|"user record"| UB{"content[0].type?"}
    UB -->|"text"| UMSG["strip &lt;ide_ blocks -><br/>UserMessage<br/>(non-text/base64 blocks dropped<br/>as side-effect; explicit document<br/>stripping planned, not yet in code)"]
    UB -->|"tool_result"| LINK["pendingToolCalls.get(tool_use_id)<br/>-> ToolResult (status from is_error;<br/>errors &amp; user-rejections both -> 'error')<br/>-> attach typed ToolCall to its AssistantMessage"]

    FLUSH --> D
    UMSG --> D
    LINK --> D

    D["ParsedConversation<br/>messages[]: UserMessage |<br/>AssistantMessage{ text, <b>thinkingBlocks[]</b>, toolCalls[] }"]

    D -->|"rendered in UI"| UI["ConversationView<br/>UserMessage - AssistantMessage<br/>ThinkingBlock - ToolCallCard"]

    D -->|"buildPayload()"| E["Plain-text payload<br/>INCLUDE: metadata, message text,<br/>tool type + path/command<br/><b>EXCLUDE: thinking</b>, tool output, sessionId"]
    E -->|"+ system prompt -> messages.create<br/>(user-selected model)"| F(["Anthropic API"])
    F --> G["Context transfer message<br/>(no fixed schema - format left to model)"]
    G -->|"copied by user ->"| H[["Claude docs stack<br/>MEMORY.md - CLAUDE.md - PRD.md<br/>project-tracker.md - phase plans"]]

    classDef disk fill:#1a1a2a,stroke:#6a6acc,color:#e8e8f5
    classDef rust fill:#2a1f0f,stroke:#d4a006,color:#f5efe8
    classDef ts fill:#0f2a1a,stroke:#06d472,color:#e8f5ee
    classDef api fill:#2a0f1a,stroke:#d4066a,color:#f5e8ee
    classDef drop fill:#2a1515,stroke:#cc5555,color:#f5dada
    class A,H disk
    class B rust
    class P0,P1,P2,SM,ACC,T1,T2,T3,FLUSH,UB,UMSG,LINK,D,E,G,UI ts
    class F api
    class X drop
```

**Key facts the pipeline encodes:**

- **Parsing is entirely TypeScript** ([`parser.ts`](../../src/lib/parser.ts)). The Rust -> IPC hop is pure transport - it hands over a raw string; no structuring happens there. See [ADR-003](../decisions/adr-003-typescript-parser.md).
- **Thinking blocks are first-class parsed data** - accumulated into `currentThinkingBlocks[]`, retained on `AssistantMessage.thinkingBlocks`, and rendered in the UI. They are dropped *only* at the `buildPayload()` boundary (internal reasoning is noise for a continuation prompt).
- **`ParsedConversation` forks two ways** - it both renders in `ConversationView` and feeds `buildPayload()`.
- **Errors and user-rejections both collapse to `status: 'error'`** (same `is_error: true` shape on the `tool_result` block).
- The final hop to the docs stack is **manual** (the user copies from OutputPanel); nothing writes MEMORY.md / CLAUDE.md automatically.

> **Footnote - base64 / `document` blocks:** non-text content blocks (including base64 `document` attachments) are dropped only as a *side-effect* of the text-only filter in [`parser.ts`](../../src/lib/parser.ts) (`block.type === "text"`). There is no explicit `document`-block stripping in the code - treat that as planned, not shipped.

---

*Not shown: the indexer caching path. On launch, `App.tsx` runs every session file through the same `parseJsonl` to build a lightweight `index.json` cache (first message + date + sessionId per file) so the sidebar loads instantly. It reuses the same parser as Diagram 2's pipeline.*
