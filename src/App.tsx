import { useEffect, useRef, useState } from "react";
import Sidebar from "./components/sidebar/Sidebar";
import ConversationView from "./components/conversation/ConversationView";
import OutputPanel from "./components/output/OutputPanel";
import TopBar from "./components/TopBar";
import type { ParsedConversation, ProjectEntry, Settings } from "./types";
import { invoke } from "@tauri-apps/api/core";
import { parseJsonl } from "./lib/parser";
import SettingsPanel from "./components/settings/SettingsPanel";
import SettingsModal from "./components/settings/SettingsModal";
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

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [sidebarWidth, setSidebarWidth] = useState(240);
  const isDragging = useRef(false);

  function onDragStart() {
    isDragging.current = true;
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
  }

  function onDragMove(e: MouseEvent) {
    if (!isDragging.current) return;
    setSidebarWidth(Math.min(480, Math.max(160, e.clientX)));
  }

  function onDragEnd() {
    isDragging.current = false;
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
  }

  const [outputPanelWidth, setOutputPanelWidth] = useState(320);
  const isOutputDragging = useRef(false);

  function onOutputDragStart() {
    isOutputDragging.current = true;
    document.addEventListener('mousemove', onOutputDragMove);
    document.addEventListener('mouseup', onOutputDragEnd);
  }

  function onOutputDragMove(e: MouseEvent) {
    if (!isOutputDragging.current) return;
    setOutputPanelWidth(Math.min(600, Math.max(240, window.innerWidth - e.clientX)));
  }

  function onOutputDragEnd() {
    isOutputDragging.current = false;
    document.removeEventListener('mousemove', onOutputDragMove);
    document.removeEventListener('mouseup', onOutputDragEnd);
  }

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

  async function reIndex() {
    try {
      if (!projectEntries) {
        return;
      }

      const newIndex = await buildIndex(projectEntries);

      await invoke("write_index", { content: JSON.stringify(newIndex) });

      setIndex(newIndex);

    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <>
      <div className="flex flex-col h-full bg-surface-base">
        <TopBar onSettingsClick={() => setIsSettingsModalOpen(true)}/>
        {isSettingsModalOpen && (
          <SettingsModal
            onClose={() => setIsSettingsModalOpen(false)}
            onOpenConfig={() => { setIsSettingsModalOpen(false); setIsConfigPanelOpen(true); }}
          />
        )}
        <SettingsPanel isOpen={isConfigPanelOpen} onClose={() => setIsConfigPanelOpen(false)} onSaved={() => setRefreshKey((prev) => prev + 1)}/>
        <div className="flex flex-1 min-h-0">
          <div style={{ width: sidebarWidth }} className="bg-surface-raised flex flex-col min-h-0 flex-shrink-0">
            <Sidebar
              projects={projectEntries}
              selectedConversationId={selectedConversationPath}
              onSelectConversation={setSelectedConversationPath}
              dirError={dirError}
              index={index}
              onReindex={reIndex}
            />
          </div>
          <div
            onMouseDown={onDragStart}
            className="w-1 cursor-col-resize bg-surface-border hover:bg-accent transition-colors flex-shrink-0"
          />
          <div className="flex-1 flex flex-col min-h-0">
            <ConversationView conversation={parsedConversation} error={fileError}/>
          </div>
          {parsedConversation && (
            <>
              <div
                onMouseDown={onOutputDragStart}
                className="w-1 cursor-col-resize bg-surface-border hover:bg-accent transition-colors flex-shrink-0"
              />
              <div
                style={{ width: outputPanelWidth }}
                className="bg-surface-raised flex flex-col min-h-0 overflow-y-auto flex-shrink-0"
              >
                <OutputPanel conversation={parsedConversation} onOpenSettings={() => setIsSettingsModalOpen(true)}/>
              </div>
            </>
          )}
        </div>
        
      </div>
    </>
  )
}



export default App;
