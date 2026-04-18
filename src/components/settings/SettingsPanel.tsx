import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import type { Settings } from "../../types";
import Button from "../ui/Button";
import IconButton from "../ui/IconButton";
import Input from "../ui/Input";

type SettingsPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export default function SettingsPanel({ isOpen, onClose, onSaved }: SettingsPanelProps) {
  const [claudeDir, setClaudeDir] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [autoIndex, setAutoIndex] = useState(true);
  const [hasExistingKey, setHasExistingKey] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load current settings and API key when panel opens
  useEffect(() => {
    async function load() {
      if (isOpen) {
        const settings = await invoke<Settings>("get_settings");

        setClaudeDir(settings.claudeDir);
        setAutoIndex(settings.autoIndex);

        try {
          await invoke("get_api_key");
          setHasExistingKey(true);
        } catch {
          setHasExistingKey(false);
        }
      }
    }
    load();
  }, [isOpen])

  // handleSave function
  async function handleSave() {
    try {
      setIsSaving(true);
      setSaveError(null);

      await invoke("save_settings", { settings: { claudeDir, autoIndex } });

      if (apiKey) {
        await invoke("set_api_key", { key: apiKey });
      }
      onSaved();
      onClose();
    } catch (error) {
      error instanceof Error ? setSaveError(error.message) : setSaveError("");

    } finally {
      setIsSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* panel */}
      <div className="relative w-[400px] h-full bg-surface-raised border-l border-surface-border p-6 flex flex-col gap-6 overflow-y-auto">
        {/* header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-primary">Settings</h2>
          <IconButton label="Close settings" onClick={onClose}>
            <X size={16} />
          </IconButton>
        </div>

        {/* Claude Directory */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
            Claude Directory
          </label>
          <Input
            type="text"
            value={claudeDir}
            onChange={(e) => setClaudeDir(e.target.value)}
            placeholder="C:\Users\you\.claude"
            className="w-full"
          />
        </div>

        {/* API Key */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
            Anthropic API Key
          </label>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={hasExistingKey ? "Key saved" : "sk-ant-..."}
            mono
            className="w-full"
          />
          {hasExistingKey && (
            <p className="text-xs text-text-muted">Key is stored. Leave blank to keep current key.</p>
          )}
        </div>

        {/* Auto-index toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-text-primary">Auto-index on open</label>
          <button
            onClick={() => setAutoIndex(!autoIndex)}
            className={`w-10 h-5 rounded-full transition-colors ${
              autoIndex ? "bg-accent" : "bg-surface-overlay border border-surface-border"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                autoIndex ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* error */}
        {saveError && (
          <p className="text-sm text-status-error">{saveError}</p>
        )}

        {/* buttons */}
        <div className="flex gap-3 mt-auto">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} loading={isSaving} className="flex-1">
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
