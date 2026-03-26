# Product Requirements Document
## CCCT - Claude Code Context Transfer

**Version**: 0.1  
**Status**: In Development  
**Platform**: Windows (desktop app)  
**Stack**: React + TypeScript + Rust + Tauri

---

## Problem Statement

Claude Code saves every conversation to a `.jsonl` file on disk. These files are:

1. **Unreadable** - raw JSONL with tool calls, base64 data, and session plumbing mixed in
2. **Undiscoverable** - UUID-named files with no way to browse "what chats do I have?"
3. **Non-transferable** - starting a new session loses all context from the previous one

The third problem is the most painful. When a session ends - due to context limits, a fresh start, or picking up work the next day - there is no structured way to carry decisions, progress, and next steps into a new session. The user must re-explain the project from scratch or rely on `claude --resume`, which fails entirely when context limits have been hit.

---

## Solution

CCCT is a Windows desktop app that:

1. **Browses** your Claude Code conversation history in a readable, organized interface
2. **Displays** conversations cleanly - filtering out noise, rendering tool calls meaningfully
3. **Generates** an AI-powered condensed continuation prompt from any session, ready to paste into a new Claude Code session

The third feature is CCCT's core differentiator. No existing tool does this.

---

## Target User

A developer who:
- Uses Claude Code regularly across multiple projects
- Has experienced context loss between sessions
- Wants to maintain continuity without manually summarizing what happened
- Works on Windows

---

## Core Features

### Feature 1 - Conversation Browser

Browse all Claude Code sessions organized by project.

- Sidebar lists projects (decoded from folder names) grouped hierarchically
- Each project shows its sessions with slug, date, and first message preview
- Sessions indexed on first launch, new sessions detected automatically on subsequent opens
- Manual re-index button for forcing a full refresh

**What it reads**: `C:\Users\<n>\.claude\projects\**\*.jsonl`

**What it never does**: modify, write to, or delete any `.jsonl` file

### Feature 2 - Conversation Viewer

Display a selected conversation as a clean, readable chat interface.

Records displayed:
- User messages (text only, document blocks collapsed)
- Assistant text responses
- Tool calls (Read, Write, Edit, Bash, Glob) - collapsed by default, expandable
- Tool results - collapsed by default, errors expanded automatically
- Thinking blocks - collapsed by default

Records filtered out:
- `queue-operation` records
- `file-history-snapshot` records
- Base64 content (document source data)

Diff view for Write/Edit operations showing lines added/removed.

### Feature 3 - Generate Condensed Prompt (Core Feature)

One-click generation of a structured continuation prompt from a conversation.

User clicks "Generate Condensed Prompt" → CCCT sends a structured payload to the Anthropic API → returns a markdown prompt ready to paste into a new Claude Code session.

**What gets sent to the API**:
- Project metadata (name, branch, date, model)
- All user messages (cleaned)
- Tool calls summary (files read, written, commands run)
- Assistant text responses
- NOT: thinking blocks, raw tool result content, session plumbing

**What comes back**:
A structured markdown document containing: session summary, project state, what was asked, what was done, decisions made, files modified, and a suggested prompt for the new session.

The output is displayed in a copyable panel. One click copies the entire prompt to clipboard.

### Feature 4 - Settings

- Claude directory path (auto-detected as `C:\Users\<n>\.claude`, overridable)
- Anthropic API key (stored in OS keychain via Tauri secure storage - never in plain JSON)
- Auto-index on open toggle

---

## Non-Features (v1 Scope)

The following are explicitly out of scope for v1:

- macOS / Linux support
- Light mode
- Session search / global search
- Token usage analytics
- Multi-provider support (Codex CLI, OpenCode)
- Subagent / worktree session handling
- Export to file
- Real-time file watching

These may be considered for future versions.

---

## Data Privacy

CCCT is 100% local. No conversation data is ever sent to any server except:
- The Anthropic API, when the user explicitly clicks "Generate Condensed Prompt"
- Only the cleaned/structured payload is sent - not raw JSONL content

The Anthropic API key is stored in the Windows OS keychain, not in any config file.

---

## Success Criteria

CCCT v1 is complete when:

1. The app auto-discovers all Claude Code sessions on first launch
2. Any session can be selected and rendered as a clean conversation
3. Clicking "Generate Condensed Prompt" returns a usable continuation prompt within 15 seconds
4. The generated prompt is copyable in one click
5. The app builds to a working `.msi` Windows installer
6. A 90-second Loom demo can be recorded showing the full flow

---

## Technical Constraints

- Tauri v2 (Rust backend + React frontend)
- React 19 + TypeScript 5.9 + Vite 7
- Tailwind CSS v3
- Anthropic API: `claude-sonnet-4-6`
- Windows only, x64
- No external database - index stored as `index.json` in AppData
- No network access except Anthropic API calls
