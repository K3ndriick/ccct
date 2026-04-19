import { useState } from "react";
import { Copy, Check } from "lucide-react";
import type { ParsedConversation } from "../../types";
import { generateContinuationPrompt } from "../../lib/anthropic";
import { invoke } from "@tauri-apps/api/core";
import Button from "../ui/Button";

const MODELS = [
  "claude-opus-4-6",
  "claude-sonnet-4-6",
  "claude-haiku-4-5",
];

type OutputPanelProps = {
  conversation: ParsedConversation | null,
  onOpenSettings: () => void
}

export default function OutputPanel({ conversation, onOpenSettings } : OutputPanelProps) {
  const [selectedModel, setSelectedModel] = useState(MODELS[1]);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAPIKeyError, setIsAPIKeyError] = useState(false);

  function handleCopy() {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleGenerate() {
    if (!conversation) return; 
    setIsLoading(true);
    setError(null);
    setIsAPIKeyError(false);

    try {
      const apiKey = await invoke("get_api_key");

      const result = await generateContinuationPrompt(conversation, selectedModel, String(apiKey));
      setGeneratedPrompt(result);
    } catch (error) {
      const msg = String(error);
      if (msg.includes("password") || msg.includes("credential")) {
        setIsAPIKeyError(true);
      } else {
        setError(error instanceof Error ? error.message : String(error));
      }
    } finally {
      setIsLoading(false);
    }
  }

  return(
    <div className="h-full flex flex-col gap-4 p-4">
      <p className="text-xs text-text-muted font-semibold uppercase tracking-wide">Output</p>

      <select
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value)}
        className="w-full bg-surface-raised border border-surface-border rounded-md px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {MODELS.map((model) => (
          <option key={model} value={model}>{model}</option>
        ))}
      </select>

      <Button
        disabled={!conversation}
        loading={isLoading}
        onClick={() => handleGenerate()}
        className="w-full"
      >
        {isLoading ? "Generating..." : "Generate Prompt"}
      </Button>
      {error && (
        <p className="text-xs text-status-error">{error}</p>
      )}
      {isAPIKeyError && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-status-error">No API key configured.</p>
          <Button variant="secondary" onClick={onOpenSettings} className="w-full">Open Settings</Button>
        </div>
      )}

      {generatedPrompt && (
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-muted">Generated prompt</p>
            <Button variant="ghost" onClick={handleCopy} className="flex items-center gap-1 text-xs">
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <pre className="flex-1 overflow-auto bg-surface-raised border border-surface-border rounded-md p-3 text-xs font-mono text-text-secondary whitespace-pre-wrap">
            {generatedPrompt}
          </pre>
        </div>
      )}
    </div>
  )
}