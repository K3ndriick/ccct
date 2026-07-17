// Shared helpers for the Anthropic API-key connection.
// The key itself lives in the OS keychain (see src-tauri/src/lib.rs) - we only
// ever hold a masked form in the UI.

export type ConnectionStatus = "connected" | "disconnected" | "error";

// maskKey - never show the full secret in the UI. Keep the recognisable
// `sk-ant-...` prefix plus the last 4 chars so a user can tell which key is live.
export function maskKey(key: string): string {
  return `sk-ant-...${key.slice(-4)}`;
}
