import { AlertTriangle, RefreshCcw } from "lucide-react";
import Button from "../ui/Button";
import type { ProjectEntry } from "../../types";
import type { Index, IndexEntry } from "../../lib/indexer";
import { useMemo, useState} from "react";

type SidebarProps = {
  projects: ProjectEntry[] | null,
  selectedConversationId: string | null,
  onSelectConversation: (id: string) => void,
  dirError: string | null,
  index: Index | null,
  onReindex: () => void
}

export default function Sidebar({ projects, selectedConversationId, onSelectConversation, dirError, index, onReindex } : SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Build a path -> IndexEntry lookup map for O(1) access when rendering
  // conversation items. Rebuilds only when index changes, not on every render.
  const indexLookup = useMemo(() => {
    const map = new Map<string, IndexEntry>();
    if (index) {
      for (const entry of index.entries) {
        map.set(entry.path, entry);
      }
    }
    return map;
  }, [index]);


  if (!projects) {
    return (<p>Loading...</p>)
  }

  if (dirError) {
    return (<p>{dirError}</p>)
  }

  if (projects.length === 0) {
    return(<p>No sessions found</p>)
  }
  
  return (
  <div className="h-full flex flex-col">
    {projects.map((project) => (
      <div key={project.name} className="mb-4">
        <p className="px-3 py-2 text-xs font-semibold uppercase text-text-muted tracking-wider">{project.name}</p>

        {project.files.map((conversation) => {
          // Look up cached metadata for this file - show first message
          // preview + date if indexed, fall back to raw filename if not
          const indexEntry = indexLookup.get(conversation.path)
          return (
          <button
            key={conversation.filename}
            onClick={() => onSelectConversation(conversation.path)}
            className={`w-full text-left px-3 py-2 text-sm cursor-pointer hover:bg-surface-overlay border-l-2 flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset
              ${conversation.path === selectedConversationId
                ? 'border-accent bg-accent-subtle text-text-primary'
                : 'border-transparent text-text-secondary'
              }`}
            >
            <span>{indexEntry?.firstMessage || conversation.filename}</span>
            <span className="text-xs text-text-muted">{indexEntry?.date}</span>
          </button>
          )
        })}
      </div>
    ))}
    <div>
      {index && index.skipped.length > 0 && (
        <>
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary w-full text-left px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            <AlertTriangle size={14} />
            <span>{index.skipped.length} files skipped</span>
          </button>
          {isOpen && index.skipped.map((file, i) => (
            <p key={i} className="text-xs text-text-secondary">
              {file.path} - {file.errorMessage}
            </p>
          ))}
        </>
      )}
    </div>

    <Button
      variant="ghost"
      onClick={() => onReindex()}
      className="mt-auto flex items-center gap-2 border-t border-surface-border px-3 py-3 w-full rounded-none"
    >
      <RefreshCcw size={14}/>
      Re-index
    </Button>
  </div>
  )
}