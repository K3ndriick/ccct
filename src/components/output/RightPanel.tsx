import { useEffect, useState } from "react";
import { Copy, Check, RefreshCw, FileText, Terminal, MessageSquare, Sparkles } from "lucide-react";
import type { ParsedConversation } from "../../types";
import type { SessionMeta } from "../../lib/sessionMeta";
import { formatTokens } from "../../lib/sessionMeta";
import { generateContinuationPrompt } from "../../lib/anthropic";
import { invoke } from "@tauri-apps/api/core";
import Button from "../ui/Button";

type RightPanelProps = {
  conversation: ParsedConversation | null;
  meta: SessionMeta | null;
  onOpenSettings: () => void;
  models: string[];
  onJumpToTurn: (messageIndex: number) => void;
};

function truncate(s: string, n: number): string {
  const one = s.replace(/\s+/g, " ").trim();
  return one.length > n ? one.slice(0, n).trimEnd() + "…" : one;
}

export default function RightPanel({ conversation, meta, onOpenSettings, models, onJumpToTurn }: RightPanelProps) {
  const [tab, setTab] = useState<"cont" | "outline">("cont");
  const [selectedModel, setSelectedModel] = useState(models[1] ?? models[0]);
  const [prompt, setPrompt] = useState("");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAPIKeyError, setIsAPIKeyError] = useState(false);

  useEffect(() => {
    if (!models.includes(selectedModel)) setSelectedModel(models[1] ?? models[0]);
  }, [models]);

  // Reset the generated prompt when the conversation changes.
  useEffect(() => {
    setPrompt("");
    setError(null);
    setIsAPIKeyError(false);
  }, [conversation]);

  const promptTokens = prompt ? Math.round(prompt.length / 4) : meta?.tokenEstimate ?? 0;

  function handleCopy() {
    if (!prompt) return;
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  async function handleGenerate() {
    if (!conversation) return;
    setIsLoading(true);
    setError(null);
    setIsAPIKeyError(false);
    try {
      const apiKey = await invoke("get_api_key");
      const result = await generateContinuationPrompt(conversation, selectedModel, String(apiKey));
      setPrompt(result);
    } catch (err) {
      const msg = String(err);
      if (msg.includes("password") || msg.includes("credential")) setIsAPIKeyError(true);
      else setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }

  const fileNames = meta ? meta.files.slice(0, 2).map((f) => f.name).join(", ") : "";
  const extraFiles = meta && meta.files.length > 2 ? `, +${meta.files.length - 2}` : "";

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Tabs */}
      <div className="flex-shrink-0 flex gap-1 px-2 pt-2 border-b border-surface-border bg-surface-header">
        {(["cont", "outline"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 text-xs font-semibold py-2.5 rounded-t-lg border border-b-0 -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              tab === t
                ? "text-text-primary bg-surface-raised border-surface-border"
                : "text-text-muted border-transparent hover:text-text-secondary"
            }`}
          >
            {t === "cont" ? "Continuation" : "Outline"}
            {t === "outline" && meta && (
              <span className="ml-1.5 font-mono text-[10px] text-text-faint">{meta.outline.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Continuation tab */}
      {tab === "cont" && (
        <div className="flex-1 overflow-y-auto min-h-0 p-4 flex flex-col gap-3.5">
          <div className="flex items-center">
            <p className="text-[13px] font-semibold text-text-primary">Continuation Prompt</p>
            <span className="ml-auto font-mono text-[10.5px] text-text-muted bg-surface-base border border-surface-border-strong rounded-md px-1.5 py-0.5 tabular-nums">
              ~{formatTokens(promptTokens)} tok
            </span>
          </div>

          {meta && (
            <div className="border border-surface-border-strong bg-surface-base rounded-[10px] p-3">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-text-faint mb-2">Captured context</p>
              <ul className="flex flex-col gap-1.5">
                <li className="flex items-center gap-2 text-xs text-text-secondary">
                  <FileText size={13} className="text-text-faint flex-shrink-0" />
                  <span>
                    {meta.files.length} files{fileNames ? ": " : ""}
                    <span className="font-mono text-text-primary">{fileNames}</span>
                    {extraFiles}
                  </span>
                </li>
                <li className="flex items-center gap-2 text-xs text-text-secondary">
                  <Terminal size={13} className="text-text-faint flex-shrink-0" />
                  <span className="tabular-nums">{meta.toolCallCount} tool calls</span>
                </li>
                <li className="flex items-center gap-2 text-xs text-text-secondary">
                  <MessageSquare size={13} className="text-text-faint flex-shrink-0" />
                  <span className="tabular-nums">{meta.userTurnCount} user turns</span>
                </li>
              </ul>
            </div>
          )}

          <div>
            <p className="text-[10.5px] uppercase tracking-wider font-semibold text-text-faint mb-1.5">Model</p>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-surface-base border border-surface-border-strong rounded-lg px-3 py-2 text-sm text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {(prompt || isLoading) && (
            <div>
              <p className="text-[10.5px] uppercase tracking-wider font-semibold text-text-faint mb-1.5">
                Prompt {prompt && <span className="normal-case tracking-normal text-text-faint">(editable)</span>}
              </p>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={isLoading ? "Generating…" : ""}
                className="w-full min-h-[140px] resize-y bg-surface-base border border-surface-border-strong rounded-[10px] px-3 py-2.5 text-xs leading-relaxed text-text-secondary font-mono focus-visible:outline-none focus-visible:border-accent-line focus-visible:ring-2 focus-visible:ring-accent-subtle"
              />
            </div>
          )}

          {error && <p className="text-xs text-status-error">{error}</p>}
          {isAPIKeyError && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-status-error">No API key configured.</p>
              <Button variant="secondary" onClick={onOpenSettings} className="w-full">
                Open Settings
              </Button>
            </div>
          )}

          <div className="flex gap-2 mt-auto pt-1">
            {prompt ? (
              <>
                <Button onClick={handleCopy} className="flex-1 flex items-center justify-center gap-2">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button
                  variant="secondary"
                  loading={isLoading}
                  onClick={handleGenerate}
                  className="flex items-center gap-2"
                >
                  <RefreshCw size={14} />
                  Regenerate
                </Button>
              </>
            ) : (
              <Button
                disabled={!conversation}
                loading={isLoading}
                onClick={handleGenerate}
                className="w-full flex items-center justify-center gap-2"
              >
                <Sparkles size={14} />
                {isLoading ? "Generating…" : "Generate prompt"}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Outline tab */}
      {tab === "outline" && (
        <div className="flex-1 overflow-y-auto min-h-0 p-3">
          <p className="text-[10.5px] uppercase tracking-wider font-semibold text-text-faint px-1 mb-2">
            User turns · click to jump
          </p>
          {meta && meta.outline.length > 0 ? (
            <div className="flex flex-col">
              {meta.outline.map((turn, i) => (
                <button
                  key={turn.messageIndex}
                  onClick={() => onJumpToTurn(turn.messageIndex)}
                  className="flex gap-2.5 px-2 py-2 rounded-lg text-left hover:bg-surface-header group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="font-mono text-[11px] text-text-faint w-4 text-right pt-0.5 tabular-nums flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12.5px] text-text-secondary group-hover:text-text-primary truncate">
                      {truncate(turn.text, 60)}
                    </span>
                    <span className="block text-[10.5px] text-text-faint mt-0.5 tabular-nums">
                      {turn.toolCount} {turn.toolCount === 1 ? "tool" : "tools"}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-faint px-1">No user turns.</p>
          )}
        </div>
      )}
    </div>
  );
}
