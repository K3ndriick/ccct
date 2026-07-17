// OS detection for display purposes (the keyboard handlers already accept both
// metaKey and ctrlKey). We only need this to label shortcuts correctly:
// macOS shows "⌘K", everything else shows "Ctrl+K".

function detectMac(): boolean {
  if (typeof navigator === "undefined") return false;
  const uaData = (navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData;
  const platform = (uaData?.platform || navigator.platform || navigator.userAgent || "").toLowerCase();
  return platform.includes("mac");
}

export const isMac = detectMac();

/** The modifier symbol on its own: "⌘" on macOS, "Ctrl" elsewhere. */
export const MOD_KEY = isMac ? "⌘" : "Ctrl";

/** A full shortcut label, e.g. modKey("K") → "⌘K" (mac) or "Ctrl+K" (win/linux). */
export function modKey(key: string): string {
  return isMac ? `${MOD_KEY}${key}` : `${MOD_KEY}+${key}`;
}
