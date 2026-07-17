import { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "./components/sidebar/Sidebar";
import ConversationView, { type ConversationViewHandle } from "./components/conversation/ConversationView";
import RightPanel from "./components/output/RightPanel";
import TopBar from "./components/TopBar";
import CommandPalette, { type PaletteAction } from "./components/CommandPalette";
import type { ParsedConversation, ProjectEntry, Settings } from "./types";
import { invoke } from "@tauri-apps/api/core";
import { parseJsonl } from "./lib/parser";
import { verifyApiKey } from "./lib/anthropic";
import { getSessionMeta } from "./lib/sessionMeta";
import { modKey } from "./lib/platform";
import { maskKey, type ConnectionStatus } from "./lib/apiKey";
import SettingsPanel from "./components/settings/SettingsPanel";
import SettingsModal from "./components/settings/SettingsModal";
import ConnectModal from "./components/ConnectModal";
import HomeScreen from "./components/home/HomeScreen";
import { buildIndex, updateIndex, type Index } from "./lib/indexer";

const FALLBACK_MODELS = ["claude-opus-4-6", "claude-sonnet-4-6", "claude-haiku-4-5"];

function App() {
  const [selectedConversationPath, setSelectedConversationPath] = useState<string | null>(null);
  const [parsedConversation, setParsedConversation] = useState<ParsedConversation | null>(null);
  const [projectEntries, setProjectEntries] = useState<ProjectEntry[] | null>(null);

  const [, setIsLoadingDir] = useState(false);
  const [dirError, setDirError] = useState<string | null>(null);

  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const [index, setIndex] = useState<Index | null>(null);

  const [availableModels, setAvailableModels] = useState<string[]>(FALLBACK_MODELS);

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [maskedKey, setMaskedKey] = useState("");
  const [isConnectOpen, setIsConnectOpen] = useState(false);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const conversationViewRef = useRef<ConversationViewHandle>(null);
  const meta = useMemo(
    () => (parsedConversation ? getSessionMeta(parsedConversation) : null),
    [parsedConversation]
  );

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
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // On launch, resolve the stored key into a connection status: connected (key
  // verifies), error (key present but couldn't verify), or disconnected (no key).
  useEffect(() => {
    async function initConnection() {
      try {
        const key = await invoke<string>("get_api_key");
        try {
          const models = await verifyApiKey(key);
          setAvailableModels(models);
          setMaskedKey(maskKey(key));
          setConnectionStatus("connected");
        } catch {
          setMaskedKey(maskKey(key));
          setConnectionStatus("error");
        }
      } catch {
        setConnectionStatus("disconnected");
      }
    }
    initConnection();
  }, []);

  function handleConnected(models: string[], masked: string) {
    setAvailableModels(models);
    setMaskedKey(masked);
    setConnectionStatus("connected");
  }

  function handleDisconnected() {
    setAvailableModels(FALLBACK_MODELS);
    setMaskedKey("");
    setConnectionStatus("disconnected");
  }

  const modelCount = connectionStatus === "connected" ? availableModels.length : 0;

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

  const paletteActions: PaletteAction[] = [
    { id: "settings", label: "Open settings", hint: modKey(","), run: () => setIsSettingsModalOpen(true) },
    { id: "reindex", label: "Re-index all conversations", run: () => reIndex() },
  ];

  return (
    <>
      <div className="flex flex-col h-full bg-surface-base">
        <TopBar
          onSettingsClick={() => setIsSettingsModalOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
          connectionStatus={connectionStatus}
          modelCount={modelCount}
          maskedKey={maskedKey}
          onOpenConnect={() => setIsConnectOpen(true)}
        />
        {isSettingsModalOpen && (
          <SettingsModal
            onClose={() => setIsSettingsModalOpen(false)}
            onOpenConfig={() => { setIsSettingsModalOpen(false); setIsConfigPanelOpen(true); }}
          />
        )}
        <SettingsPanel isOpen={isConfigPanelOpen} onClose={() => setIsConfigPanelOpen(false)} onSaved={() => setRefreshKey((prev) => prev + 1)} />
        <ConnectModal
          open={isConnectOpen}
          onClose={() => setIsConnectOpen(false)}
          status={connectionStatus}
          maskedKey={maskedKey}
          modelCount={availableModels.length}
          onConnected={handleConnected}
          onDisconnected={handleDisconnected}
        />
        <CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          index={index}
          onSelectConversation={(path) => setSelectedConversationPath(path)}
          actions={paletteActions}
        />
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
            <ConversationView
              ref={conversationViewRef}
              conversation={parsedConversation}
              meta={meta}
              isLoading={isLoadingFile}
              error={fileError}
              emptyState={
                <HomeScreen
                  connectionStatus={connectionStatus}
                  modelCount={modelCount}
                  onOpenConnect={() => setIsConnectOpen(true)}
                  index={index}
                  onSelectConversation={setSelectedConversationPath}
                  onOpenPalette={() => setPaletteOpen(true)}
                />
              }
            />
          </div>
          {parsedConversation && (
            <>
              <div
                onMouseDown={onOutputDragStart}
                className="w-1 cursor-col-resize bg-surface-border hover:bg-accent transition-colors flex-shrink-0"
              />
              <div
                style={{ width: outputPanelWidth }}
                className="bg-surface-raised flex flex-col min-h-0 flex-shrink-0"
              >
                <RightPanel
                  conversation={parsedConversation}
                  meta={meta}
                  onOpenSettings={() => setIsSettingsModalOpen(true)}
                  models={availableModels}
                  onJumpToTurn={(i) => conversationViewRef.current?.scrollToTurn(i)}
                />
              </div>
            </>
          )}
        </div>
        
      </div>
    </>
  )
}



export default App;
