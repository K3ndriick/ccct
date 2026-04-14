import { useEffect, useState } from "react";
import Sidebar from "./components/sidebar/Sidebar";
import ConversationView from "./components/conversation/ConversationView";
import OutputPanel from "./components/output/OutputPanel";
import TopBar from "./components/TopBar";
import type { ParsedConversation, ProjectEntry, Settings } from "./types";
import { invoke } from "@tauri-apps/api/core";
import { parseJsonl } from "./lib/parser";
import SettingsPanel from "./components/settings/SettingsPanel";
import { buildIndex, updateIndex, type Index } from "./lib/indexer";

function App() {
  const [selectedConversationPath, setSelectedConversationPath] = useState<string | null>(null);
  const [parsedConversation, setParsedConversation] = useState<ParsedConversation | null>(null);
  const [projectEntries, setProjectEntries] = useState<ProjectEntry[] | null>(null);

  const [isLoadingDir, setIsLoadingDir] = useState(false);
  const [dirError, setDirError] = useState<string | null>(null);

  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const [index, setIndex] = useState<Index | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
  async function load() {
  try {
    setIsLoadingDir(true);
    setDirError(null);

    const settings = await invoke<Settings>("get_settings");

    const entries = await invoke<ProjectEntry[]>("read_claude_dir", { claudeDir: settings.claudeDir });

    // Index flow: try loading cached index from AppData, then either
    // incrementally update it (fast - only new files) or full rebuild (slow - all files)
    let updatedIndex: Index;

    try {
      // fast path: index exists, only parse new files
      const raw = await invoke<string>("read_index");
      const existing: Index = JSON.parse(raw);
      updatedIndex = await updateIndex(existing, entries);
    } catch {
      // slow path: no index file exists, full build
      updatedIndex = await buildIndex(entries);
    }

    // persist updated index to AppData for next launch
    await invoke("write_index", { content: JSON.stringify(updatedIndex) });
    setIndex(updatedIndex);

    setProjectEntries(entries);
  } catch (error) {
    console.log("ERROR", error);
    setDirError(error instanceof Error ? error.message : String(error));
  } finally {
    setIsLoadingDir(false);
  }
}

  load();
  }, [refreshKey]);

  useEffect(() => {
    if (!selectedConversationPath) {
      return;
    }

    async function load() {
      try {
        setIsLoadingFile(true);
        setFileError(null);

        const raw = await invoke<string>("read_file", { path: selectedConversationPath });
        const parsed = parseJsonl(raw);
        setParsedConversation(parsed);
      } catch (error) {
        setFileError(error instanceof Error ? error.message : String(error));
      } finally {
        setIsLoadingFile(false);
      }
    }
  load();
  }, [selectedConversationPath]);

  return (
    <>
      <div className="flex flex-col h-full bg-surface-base">
        <TopBar onSettingsClick={() => setIsSettingsOpen(true)}/>
        <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onSaved={() => setRefreshKey((prev) => prev + 1)}/>
        <div className="flex flex-1">
          <div className="w-[240px] bg-surface-raised border-r border-surface-border flex flex-col">
            <Sidebar
              projects={projectEntries}
              selectedConversationId={selectedConversationPath}
              onSelectConversation={setSelectedConversationPath}
              dirError={dirError}
              index={index}
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            <ConversationView conversation={parsedConversation}/>
          </div>
          <div className="w-[320px] bg-surface-raised border-l border-surface-border">
            <OutputPanel conversation={parsedConversation}/>
          </div>
        </div>
        
      </div>
    </>
  )
}



export default App;
