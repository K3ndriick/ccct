# ADR-004: API Key Stored in OS Keychain, not .env

---

## Context

CCCT calls the Anthropic API to generate continuation prompts. This requires an API key that is billed per token - exposing it or storing it carelessly has real financial consequences. The question was where to store it in a shipped desktop app.

During development the key lived in a `.env` file (gitignored), read by Vite as `VITE_ANTHROPIC_API_KEY`. This pattern is standard for web development but is not appropriate for a distributed desktop app, where the app is installed on the user's machine rather than running on a controlled server.

The threat model is straightforward: any file stored in plaintext on disk is readable by anything running under the same user account - other apps, scripts, or malware. An API key sitting in a flat file next to the executable is an easy target.

---

## Options Considered

### .env file (shipped with the app) 

A `.env` file gitignored during development becomes a real problem in a shipped app. To work at runtime, the file would need to ship with the installer or be created during setup - either way it lives on disk in plaintext. Anyone with filesystem access to the install directory can read it. This is the wrong model for secrets in a desktop app.

### OS Keychain (Windows Credential Manager)

Windows Credential Manager is the OS-provided secure credential store. It encrypts credentials using the user's Windows login and exposes them only to processes running as that user. It is the platform-native answer to "where do I store a secret on Windows."

CCCT uses the `keyring` Rust crate to talk to Credential Manager. The implementation is two Tauri commands:

```rust
fn get_api_key() -> Result<String, String> {
    let entry = keyring::Entry::new("ccct", "anthropic_api_key")?;
    entry.get_password().map_err(|e| e.to_string())
}

fn set_api_key(key: String) -> Result<(), String> {
    let entry = keyring::Entry::new("ccct", "anthropic_api_key")?;
    entry.set_password(&key).map_err(|e| e.to_string())
}
```

The key is stored under the service name `ccct` and is never written to any file on disk. The Settings panel calls `invoke("set_api_key")` when the user saves their key, and `anthropic.ts` calls `invoke("get_api_key")` at generation time. The rest of `settings.json` (Claude directory path, auto-index toggle) is stored as plain JSON in AppData - only the API key goes through the keychain.

---

## Decision

OS keychain via the `keyring` crate. The reasoning is simple: this is a shipped desktop app with real user credentials, not a dev environment. Plaintext files are the wrong storage model for secrets. The OS already provides the right tool - using it required a small Rust dependency and two command handlers, which is a low cost for the security properties gained.

---

## Consequences

The `keyring` crate abstracted away the Windows Credential Manager API cleanly - the implementation was straightforward and caused no issues during development or testing.

The UX consequence is that on first launch the API key is not set, and the app must prompt the user to enter it through the Settings panel before generation works. This is the correct flow - the key is entered once, stored securely, and never handled again.
