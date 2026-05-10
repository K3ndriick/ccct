import { useState, useEffect } from "react";
import { X, FolderOpen } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { Settings } from "../../types";
import Button from "../ui/Button";
import IconButton from "../ui/IconButton";
import Input from "../ui/Input";
import ApiKeyCard from "./ApiKeyCard";

type SettingsPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  onModelsLoaded: (models: string[]) => void;
  onDisconnected: () => void;
};

export default function SettingsPanel({ isOpen, onClose, onSaved, onModelsLoaded, onDisconnected }: SettingsPanelProps) {
  const [claudeDir, setClaudeDir] = useState("");
  const [autoIndex, setAutoIndex] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (isOpen) {
        const settings = await invoke<Settings>("get_settings");
        setClaudeDir(settings.claudeDir);
        setAutoIndex(settings.autoIndex);
      }
    }
    load();
  }, [isOpen])

  async function handleSave() {
    try {
      setIsSaving(true);
      setSaveError(null);
      await invoke("save_settings", { settings: { claudeDir, autoIndex } });
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
          <div className="flex gap-2">
            <Input
              type="text"
              value={claudeDir}
              onChange={(e) => setClaudeDir(e.target.value)}
              placeholder="C:\Users\you\.claude"
              className="flex-1"
            />
            <IconButton
              label="Browse for folder"
              className="px-2 border border-surface-border rounded-md hover:border-accent"
              onClick={async () => {
                const selected = await open({ directory: true, multiple: false });
                if (typeof selected === 'string') setClaudeDir(selected);
              }}
            >
              <FolderOpen size={16} />
            </IconButton>
          </div>
        </div>

        {/* API Key */}
        <ApiKeyCard onModelsLoaded={onModelsLoaded} onDisconnected={onDisconnected} />

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
