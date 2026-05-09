# ADR-001: Tauri over Electron

---

## Context

CCCT is a desktop app that reads Claude Code session files from the local filesystem and calls the Anthropic API to generate continuation prompts. The two main desktop framework options for a React + TypeScript frontend with a native backend were Electron and Tauri.

The key constraints driving the decision:

- **Windows-only target**: no cross-platform requirement for v1
- **Local filesystem access**: the app reads `~/.claude/projects/**/*.jsonl` directly from disk
- **API key security**: the Anthropic API key needed to be stored and accessed securely, without any network-exposed server
- **First Rust project**: Tauri's backend language (Rust) was unfamiliar territory

---

## Options Considered

### Electron

Electron's main strength is its maturity and ecosystem. It bundles Chromium and Node.js, giving access to the full npm ecosystem on the backend and a well-documented path for filesystem access, native dialogs, and OS integration. Cross-platform support (Windows, macOS, Linux) comes out of the box.

The drawback for this project: Electron installers are large (typically 100-200MB+) because they ship a full Chromium instance. Since CCCT targets Windows only and does not need the cross-platform reach, bundling Chromium is dead weight with no payoff.

### Tauri

Tauri uses the OS-native webview (WebView2 on Windows 10/11, which ships pre-installed) rather than bundling Chromium. This results in much smaller binaries. The Rust backend gives direct, performant access to the filesystem and OS APIs without going through a Node.js layer.

The real cost: Rust has a steep learning curve. This was the first Rust project, which meant the backend had to be kept intentionally minimal - only the parts that genuinely needed native access (file reads, keychain, AppData paths) were written in Rust. Everything else stayed in TypeScript.

### Web app

A browser-based app was briefly considered and rejected on security grounds. A web app would require a backend server to proxy Anthropic API calls, which introduces a network hop and makes the API key harder to protect. A local desktop app keeps the key entirely on the user's machine - no server, no network exposure, no additional auth layer needed.

---

## Decision

Tauri. The three decisive factors:

1. **Windows-only target removes Electron's main advantage.** Cross-platform support is what justifies Electron's size. Since v1 was Windows-only, shipping 150MB+ of Chromium had no benefit.
2. **Security is simpler with a local app.** No server means no API key in transit, no backend to secure, no network surface to worry about.
3. **WebView2 is pre-installed on Windows 10/11.** Tauri's dependency on the OS webview is not a risk on the Windows target - it is already there.

The Rust learning curve was the real cost, and it was managed by keeping the Rust backend thin: only native OS operations live there, with all parsing and business logic staying in TypeScript.

---

## Consequences

**Harder than expected**: Rust's ownership model and the Tauri command system had a learning curve. Debugging errors that crossed the Rust/TypeScript boundary (serialization mismatches, command signatures) was slower than equivalent work in a Node.js backend would have been.

**Easier than expected**: WebView2 on Windows worked seamlessly - no driver or dependency issues on the test machines. The Tauri dev build and production build pipeline were straightforward once the Rust backend was stable.

**Same call again**: yes. For a Windows-only tool where binary size and API key security matter, Tauri is the right choice. The Rust learning cost was real but bounded - Tauri's requirement of Rust was the primary reason for picking it up, with learning the language being a secondary benefit rather than a driving goal.
