import { AlertTriangle, RefreshCcw, Loader2, FolderOpen, Search, ChevronDown, ChevronRight } from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import type { ProjectEntry } from "../../types";
import type { Index, IndexEntry } from "../../lib/indexer";
import { useMemo, useState } from "react";

type SidebarProps = {
  projects: ProjectEntry[] | null,
  selectedConversationId: string | null,
  onSelectConversation: (id: string) => void,
  dirError: string | null,
  index: Index | null,
  onReindex: () => void
}

export default function Sidebar({ projects, selectedConversationId, onSelectConversation, dirError, index, onReindex }: SidebarProps) {
  const [skippedOpen, setSkippedOpen] = useState(false);
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');

  const indexLookup = useMemo(() => {
    const map = new Map<string, IndexEntry>();
    if (index) {
      for (const entry of index.entries) {
        map.set(entry.path, entry);
      }
    }
    return map;
  }, [index]);

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

  function toggleProject(name: string) {
    setCollapsedProjects(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

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
    <div className="flex flex-col h-full min-h-0">

      {/* Fixed: search input */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-surface-border relative">
        <Search size={12} className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <Input
          placeholder="Search conversations..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-7 py-1.5 text-xs"
        />
      </div>

      {/* Scrollable: project list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredProjects.length === 0 && query && (
          <div className="flex flex-col items-center justify-center h-full gap-1 text-center px-4">
            <p className="text-sm text-text-secondary">No results</p>
            <p className="text-xs text-text-muted">Try a different search term</p>
          </div>
        )}

        {filteredProjects.map((project) => {
          const isCollapsed = collapsedProjects.has(project.name);
          return (
            <div key={project.name}>
              <button
                onClick={() => toggleProject(project.name)}
                aria-expanded={!isCollapsed}
                className="flex items-center gap-1.5 w-full px-3 py-2 text-xs font-semibold uppercase text-text-muted tracking-wider hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
              >
                {isCollapsed
                  ? <ChevronRight size={12} className="shrink-0" />
                  : <ChevronDown size={12} className="shrink-0" />
                }
                <span className="truncate">{project.name}</span>
                <span className="ml-auto font-normal normal-case tracking-normal">{project.files.length}</span>
              </button>

              {!isCollapsed && project.files.map((conversation) => {
                const indexEntry = indexLookup.get(conversation.path);
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
                    <span className="truncate text-xs">{indexEntry?.firstMessage || conversation.filename}</span>
                    <span className="text-xs text-text-muted">{indexEntry?.date}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Fixed: skipped files + re-index */}
      <div className="flex-shrink-0 border-t border-surface-border">
        {index && index.skipped.length > 0 && (
          <>
            <button
              onClick={() => setSkippedOpen(!skippedOpen)}
              aria-expanded={skippedOpen}
              className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary w-full text-left px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <AlertTriangle size={14} />
              <span>{index.skipped.length} files skipped</span>
            </button>
            {skippedOpen && index.skipped.map((file, i) => (
              <p key={i} className="text-xs text-text-secondary px-3 py-0.5 truncate">
                {file.path} - {file.errorMessage}
              </p>
            ))}
          </>
        )}
        <Button
          variant="ghost"
          onClick={() => onReindex()}
          className="flex items-center gap-2 px-3 py-3 w-full rounded-none"
        >
          <RefreshCcw size={14} />
          Re-index
        </Button>
      </div>
    </div>
  )
}
