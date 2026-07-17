import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { X, Lock, ShieldCheck, Send, Check, KeyRound } from "lucide-react";
import { verifyApiKey } from "../lib/anthropic";
import { maskKey, type ConnectionStatus } from "../lib/apiKey";
import Button from "./ui/Button";
import Input from "./ui/Input";
import IconButton from "./ui/IconButton";

type ConnectModalProps = {
  open: boolean;
  onClose: () => void;
  status: ConnectionStatus;
  maskedKey: string;
  modelCount: number;
  onConnected: (models: string[], maskedKey: string) => void;
  onDisconnected: () => void;
};

// Transient UI states layered on top of the persistent connection `status`.
// `null` = show the status-driven default (connected summary or empty prompt).
type View = "entering" | "verifying" | "error" | "confirmDisconnect" | null;

export default function ConnectModal({
  open,
  onClose,
  status,
  maskedKey,
  modelCount,
  onConnected,
  onDisconnected,
}: ConnectModalProps) {
  const [view, setView] = useState<View>(null);
  const [inputKey, setInputKey] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Reset transient state whenever the modal is (re)opened.
  useEffect(() => {
    if (open) {
      setView(null);
      setInputKey("");
      setErrorMsg("");
    }
  }, [open]);

  // Esc closes (unless mid-verify, where it would leave state ambiguous).
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && view !== "verifying") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, view, onClose]);

  if (!open) return null;

  async function handleVerify() {
    const key = inputKey.trim();
    if (!key) return;
    setView("verifying");
    setErrorMsg("");
    try {
      const models = await verifyApiKey(key);
      await invoke("set_api_key", { key });
      onConnected(models, maskKey(key));
      setInputKey("");
      setView(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Verification failed");
      setView("error");
    }
  }

  async function handleDisconnect() {
    try {
      await invoke("delete_api_key");
    } catch {
      // key may already be gone - treat as success
    }
    onDisconnected();
    setView(null);
  }

  const showForm = view === "entering" || view === "error";
  const isConnected = status === "connected" && view === null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center">
      {/* scrim */}
      <div className="absolute inset-0 bg-[rgba(6,5,5,0.55)]" onClick={() => view !== "verifying" && onClose()} />

      {/* modal */}
      <div className="relative mt-20 w-[min(520px,90%)] rounded-2xl border border-surface-emphasis bg-surface-raised shadow-[0_22px_50px_-28px_rgba(0,0,0,0.7)]">
        {/* header */}
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-surface-overlay border border-surface-border-strong text-text-secondary">
              <Lock size={16} strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Connect to Anthropic</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Your key powers continuation-prompt generation.
              </p>
            </div>
          </div>
          <IconButton label="Close" onClick={onClose} className="p-1 -mr-1 rounded-md hover:bg-surface-overlay">
            <X size={16} />
          </IconButton>
        </div>

        {/* body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {/* connected summary */}
          {isConnected && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-overlay px-3.5 py-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Check size={15} strokeWidth={2.5} className="text-text-secondary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-text-primary font-medium">Connected</p>
                    <p className="text-xs font-mono text-text-muted truncate">{maskedKey}</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-text-muted tabular-nums flex-shrink-0 ml-3">
                  {modelCount} models
                </span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                {modelCount} models are available to choose from when you generate a continuation prompt.
              </p>
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  className="text-xs text-status-error hover:text-status-error px-2 py-1"
                  onClick={() => setView("confirmDisconnect")}
                >
                  Disconnect
                </Button>
              </div>
            </div>
          )}

          {/* not connected - prompt to connect */}
          {!isConnected && view === null && (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-text-secondary leading-relaxed">
                {status === "error"
                  ? "We couldn't verify your saved key. Enter it again to reconnect."
                  : "Paste your Anthropic API key to unlock the models CCCT uses for context transfer."}
              </p>
              <Button className="text-sm px-3.5 py-2" onClick={() => setView("entering")}>
                <span className="inline-flex items-center gap-2">
                  <KeyRound size={14} strokeWidth={2} />
                  Enter API key
                </span>
              </Button>
            </div>
          )}

          {/* entering / error - the input */}
          {showForm && (
            <div className="flex flex-col gap-2.5">
              <label className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
                Anthropic API key
              </label>
              <Input
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                placeholder="sk-ant-..."
                mono
                autoFocus
                className="w-full"
              />
              {view === "error" && <p className="text-xs text-status-error">{errorMsg}</p>}
              <p className="text-[11px] text-text-faint">
                Find your key at <span className="font-mono text-text-muted">console.anthropic.com/settings/keys</span>
              </p>
              <div className="flex gap-2 pt-1">
                <Button
                  variant="secondary"
                  className="flex-1 text-sm"
                  onClick={() => {
                    setView(null);
                    setInputKey("");
                    setErrorMsg("");
                  }}
                >
                  Cancel
                </Button>
                <Button className="flex-1 text-sm" onClick={handleVerify} disabled={!inputKey.trim()}>
                  {view === "error" ? "Retry" : "Verify & connect"}
                </Button>
              </div>
            </div>
          )}

          {/* verifying */}
          {view === "verifying" && (
            <div className="flex items-center gap-2.5 text-sm text-text-secondary py-1">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
              Verifying with Anthropic…
            </div>
          )}

          {/* confirm disconnect */}
          {view === "confirmDisconnect" && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-text-secondary leading-relaxed">
                Remove the stored key from your OS keychain? You'll need to re-enter it to generate prompts again.
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1 text-sm" onClick={() => setView(null)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 text-sm bg-status-error hover:bg-status-error/85 text-white"
                  onClick={handleDisconnect}
                >
                  Disconnect
                </Button>
              </div>
            </div>
          )}

          {/* security story - always visible; this is the "official/secure" reassurance */}
          <div className="mt-1 pt-4 border-t border-surface-border flex flex-col gap-2.5">
            <TrustRow
              icon={<Lock size={13} strokeWidth={2} />}
              title="Stored in your OS keychain"
              body="Saved to your system credential store (Windows Credential Manager / macOS Keychain) - never written to disk in plain text."
            />
            <TrustRow
              icon={<ShieldCheck size={13} strokeWidth={2} />}
              title="Verified without spending tokens"
              body="We confirm the key with a read-only models check. No messages are sent and nothing is billed."
            />
            <TrustRow
              icon={<Send size={13} strokeWidth={2} />}
              title="Sent only to Anthropic"
              body="Your key and conversations go straight from this app to Anthropic's API. There is no CCCT server in between."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustRow({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 text-text-muted flex-shrink-0">{icon}</span>
      <div>
        <p className="text-xs font-medium text-text-secondary">{title}</p>
        <p className="text-[11px] text-text-muted leading-relaxed mt-0.5">{body}</p>
      </div>
    </div>
  );
}
