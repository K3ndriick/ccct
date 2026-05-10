import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { verifyApiKey } from "../../lib/anthropic";
import Button from "../ui/Button";
import Input from "../ui/Input";

type ConnectionState = "disconnected" | "entering" | "verifying" | "connected" | "confirming" | "error";

type ApiKeyCardProps = {
  onModelsLoaded: (models: string[]) => void;
  onDisconnected: () => void;
};

export default function ApiKeyCard({ onModelsLoaded, onDisconnected }: ApiKeyCardProps) {
  const [state, setState] = useState<ConnectionState>("disconnected");
  const [inputKey, setInputKey] = useState("");
  const [maskedKey, setMaskedKey] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function checkExisting() {
      try {
        const key = await invoke<string>("get_api_key");
        setMaskedKey(maskKey(key));
        setState("connected");
      } catch {
        setState("disconnected");
      }
    }
    checkExisting();
  }, []);

  function maskKey(key: string): string {
    return `sk-ant-...${key.slice(-4)}`;
  }

  async function handleVerifyAndSave() {
    if (!inputKey.trim()) return;
    setState("verifying");
    setErrorMsg("");
    try {
      const models = await verifyApiKey(inputKey.trim());
      await invoke("set_api_key", { key: inputKey.trim() });
      onModelsLoaded(models);
      setMaskedKey(maskKey(inputKey.trim()));
      setInputKey("");
      setState("connected");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Verification failed");
      setState("error");
    }
  }

  async function handleDisconnect() {
    try {
      await invoke("delete_api_key");
    } catch {
      // key may already be gone
    }
    setMaskedKey("");
    setInputKey("");
    setState("disconnected");
    onDisconnected();
  }

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg border border-surface-border bg-surface-overlay">
      {/* header row */}
      <div className="flex items-center gap-2">
        <StatusDot state={state} />
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
          Anthropic API Key
        </span>
      </div>

      {/* disconnected */}
      {state === "disconnected" && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">No key connected</span>
          <Button variant="primary" className="text-xs px-3 py-1.5" onClick={() => setState("entering")}>
            Connect
          </Button>
        </div>
      )}

      {/* entering */}
      {(state === "entering" || state === "error") && (
        <div className="flex flex-col gap-2">
          <Input
            type="password"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleVerifyAndSave()}
            placeholder="sk-ant-..."
            mono
            className="w-full"
            autoFocus
          />
          {state === "error" && (
            <p className="text-xs text-status-error">{errorMsg}</p>
          )}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1 text-xs"
              onClick={() => { setState("disconnected"); setInputKey(""); setErrorMsg(""); }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 text-xs"
              onClick={handleVerifyAndSave}
              disabled={!inputKey.trim()}
            >
              {state === "error" ? "Retry" : "Verify & Save"}
            </Button>
          </div>
        </div>
      )}

      {/* verifying */}
      {state === "verifying" && (
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <span className="w-3 h-3 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          Verifying connection...
        </div>
      )}

      {/* connected */}
      {state === "connected" && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-mono text-text-secondary">{maskedKey}</span>
          <Button
            variant="ghost"
            className="text-xs text-status-error hover:text-status-error px-2 py-1"
            onClick={() => setState("confirming")}
          >
            Disconnect
          </Button>
        </div>
      )}

      {/* confirming disconnect */}
      {state === "confirming" && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-text-secondary">
            Remove the stored API key? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1 text-xs"
              onClick={() => setState("connected")}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 text-xs bg-status-error hover:bg-status-error/80 text-white"
              onClick={handleDisconnect}
            >
              Yes, disconnect
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusDot({ state }: { state: ConnectionState }) {
  const colors: Record<ConnectionState, string> = {
    disconnected: "bg-text-muted",
    entering: "bg-text-muted",
    verifying: "bg-accent animate-pulse",
    connected: "bg-accent",
    confirming: "bg-status-error",
    error: "bg-status-error",
  };
  return <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors[state]}`} />;
}
