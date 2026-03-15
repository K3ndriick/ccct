import { useState } from "react";
import { Copy, Check } from "lucide-react";
import type { Conversation } from "../../types";

const MODELS = [
  "claude-opus-4-6",
  "claude-sonnet-4-6",
  "claude-haiku-4-5",
];

interface OutputPanelProps {
  conversation: Conversation | null
}

export default function OutputPanel({ conversation } : OutputPanelProps) {
  const fakeString = "<context_transfer>\n  <session_summary>...</session_summary>\n  <files_modified>...</files_modified>\n  <decisions_made>...</decisions_made>\n  <current_state>...</current_state>\n  <next_steps>...</next_steps>\n</context_transfer>";
  const [selectedModel, setSelectedModel] = useState(MODELS[1]);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return(
    <div className="h-full flex flex-col gap-4 p-4">
      <p className="text-xs text-text-muted font-semibold uppercase tracking-wide">Output</p>

      <select
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value)}
        className="w-full bg-surface-raised border border-surface-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none"
      >
        {MODELS.map((model) => (
          <option key={model} value={model}>{model}</option>
        ))}
      </select>

      <button
        disabled={!conversation}
        onClick={() => setGeneratedPrompt(fakeString)}
        className="w-full py-2 rounded-md text-sm font-medium transition-colors
          disabled:bg-surface-raised disabled:text-text-muted disabled:cursor-not-allowed
          enabled:bg-accent enabled:text-white enabled:hover:bg-accent-dim enabled:cursor-pointer"
      >
        Generate Prompt
      </button>

      {generatedPrompt && (
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-muted">Generated prompt</p>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="flex-1 overflow-auto bg-surface-raised border border-surface-border rounded-md p-3 text-xs font-mono text-text-secondary whitespace-pre-wrap">
            {generatedPrompt}
          </pre>
        </div>
      )}
    </div>
  )
}