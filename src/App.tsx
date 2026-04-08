import { useEffect, useState } from "react";
import Sidebar from "./components/sidebar/Sidebar";
import ConversationView from "./components/conversation/ConversationView";
import OutputPanel from "./components/output/OutputPanel";
import TopBar from "./components/TopBar";
import type { ParsedConversation, ProjectEntry, Settings } from "./types";
import { invoke } from "@tauri-apps/api/core";
import { parseJsonl } from "./lib/parser";

function App() {
  const [selectedConversationPath, setSelectedConversationPath] = useState<string | null>(null);
  const [parsedConversation, setParsedConversation] = useState<ParsedConversation | null>(null);
  const [projectEntries, setProjectEntries] = useState<ProjectEntry[] | null>(null);

  const [isLoadingDir, setIsLoadingDir] = useState(false);
  const [dirError, setDirError] = useState<string | null>(null);

  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
  async function load() {
    try {
      setIsLoadingDir(true);
      setDirError(null);

      const settings = await invoke<Settings>("get_settings");

      const entries = await invoke<ProjectEntry[]>("read_claude_dir", { claude_dir: settings.claudeDir });
      setProjectEntries(entries);
    } catch (error) {
      setDirError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoadingDir(false);
    }
  }
  load();
  }, []);

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
        <TopBar/>
        <div className="flex flex-1">
          <div className="w-[240px] bg-surface-raised border-r border-surface-border flex flex-col">
            <Sidebar
              projects={projectEntries}
              selectedConversationId={selectedConversationPath}
              onSelectConversation={setSelectedConversationPath}
              dirError={dirError}
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
