import { AlertTriangle, RefreshCcw, Loader2, FolderOpen, Search } from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";
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
  const [query, setQuery] = useState('');

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

  // grabbing projects that meet the search query
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects
      .map(project => ({
        ...project,
        files: project.files.filter(conv => {
          const label = indexLookup.get(conv.path)?.firstMessage ?? conv.filename;
          return label.toLowerCase().includes(q);
        }),
      }))
      .filter(project => project.files.length > 0);
  }, [projects, query, indexLookup]);


  if (!projects) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4">
        <Loader2 size={24} className="text-text-muted animate-spin" />
        <p className="text-sm text-text-secondary">Scanning...</p>
      </div>
    )
  }

  if (dirError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4">
        <AlertTriangle size={24} className="text-status-error" />
        <p className="text-sm font-medium text-text-secondary">Directory error</p>
        <p className="text-xs text-text-muted">{dirError}</p>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4">
        <FolderOpen size={24} className="text-text-muted" />
        <p className="text-sm font-medium text-text-secondary">No sessions found</p>
        <p className="text-xs text-text-muted">Check your Claude directory in Settings</p>
      </div>
    )
  }
  
  return (
  <div className="h-full flex flex-col">
    <div className="px-3 py-2 border-b border-surface-border relative">
      <Search size={12} className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
      <Input
        placeholder="Search conversations..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="w-full pl-7 py-1.5 text-xs"
      />
    </div>
    {filteredProjects.length === 0 && query && (
      <div className="flex flex-col items-center justify-center flex-1 gap-1 text-center px-4">
        <p className="text-sm text-text-secondary">No results</p>
        <p className="text-xs text-text-muted">Try a different search term</p>
      </div>
    )}
    {filteredProjects.map((project) => (
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