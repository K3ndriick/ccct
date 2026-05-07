import { AlertTriangle, RefreshCcw, Loader2, FolderOpen, Search, ChevronDown, ChevronRight } from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import type { ProjectEntry } from "../../types";
import type { Index, IndexEntry } from "../../lib/indexer";
import { useMemo, useState, useRef, useEffect } from "react";
import { formatRelativeDate } from "../../lib/relativeDate";

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent/25 text-accent rounded-sm">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

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
  const [focusedNavIndex, setFocusedNavIndex] = useState<number | null>(null);
  const navItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const indexLookup = useMemo(() => {
    const map = new Map<string, IndexEntry>();
    if (index) {
      for (const entry of index.entries) {
        map.set(entry.path, entry);
      }
    }
    return map;
  }, [index]);

  type NavItem =
    | { type: 'project'; name: string }
    | { type: 'conversation'; projectName: string; path: string };

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

  // Flat list of items visible in the sidebar (collapsed projects hide their children)
  const navItems = useMemo<NavItem[]>(() => {
    const items: NavItem[] = [];
    for (const project of filteredProjects) {
      items.push({ type: 'project', name: project.name });
      if (!collapsedProjects.has(project.name)) {
        for (const conv of project.files) {
          items.push({ type: 'conversation', projectName: project.name, path: conv.path });
        }
      }
    }
    return items;
  }, [filteredProjects, collapsedProjects]);

  // Map from stable key -> navItems index so JSX can look up each button's slot in O(1)
  const navIndexByKey = useMemo(() => {
    const map = new Map<string, number>();
    navItems.forEach((item, i) => {
      map.set(item.type === 'project' ? `p:${item.name}` : `c:${item.path}`, i);
    });
    return map;
  }, [navItems]);

  // Imperatively focus the DOM button whenever the keyboard-active index changes
  useEffect(() => {
    if (focusedNavIndex !== null) {
      navItemRefs.current[focusedNavIndex]?.focus();
    }
  }, [focusedNavIndex]);

  function toggleProject(name: string) {
    setCollapsedProjects(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  function handleListKeyDown(e: React.KeyboardEvent) {
    if (navItems.length === 0) return;
    const current = focusedNavIndex ?? 0;
    const item = navItems[current];

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        setFocusedNavIndex(current < navItems.length - 1 ? current + 1 : 0);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        setFocusedNavIndex(current > 0 ? current - 1 : navItems.length - 1);
        break;
      }
      case 'ArrowRight': {
        if (item?.type === 'project' && collapsedProjects.has(item.name)) {
          e.preventDefault();
          toggleProject(item.name);
        }
        break;
      }
      case 'ArrowLeft': {
        if (item?.type === 'project' && !collapsedProjects.has(item.name)) {
          e.preventDefault();
          toggleProject(item.name);
        } else if (item?.type === 'conversation') {
          e.preventDefault();
          // Jump focus back up to the parent project header
          const parentIdx = navItems.findIndex(
            (n, i) => i < current && n.type === 'project' && n.name === item.projectName
          );
          if (parentIdx !== -1) setFocusedNavIndex(parentIdx);
        }
        break;
      }
      default: {
        // Typeahead: route printable characters to the search box
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          setQuery(prev => prev + e.key);
          searchInputRef.current?.focus();
        }
      }
    }
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown' && navItems.length > 0) {
      e.preventDefault();
      setFocusedNavIndex(0);
    }
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

  // Roving tabindex: only the active nav item has tabIndex=0; all others -1.
  // When nothing is keyboard-focused yet, index 0 is the Tab entry point.
  const effectiveFocused = focusedNavIndex ?? 0;

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* Fixed: search input */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-surface-border relative">
        <Search size={12} className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <Input
          ref={searchInputRef}
          placeholder="Search conversations..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="w-full pl-7 py-1.5 text-xs"
        />
      </div>

      {/* Scrollable: project list */}
      <div className="flex-1 overflow-y-auto min-h-0" onKeyDown={handleListKeyDown}>
        {filteredProjects.length === 0 && query && (
          <div className="flex flex-col items-center justify-center h-full gap-1 text-center px-4">
            <p className="text-sm text-text-secondary">No results</p>
            <p className="text-xs text-text-muted">Try a different search term</p>
          </div>
        )}

        {filteredProjects.map((project) => {
          const isCollapsed = collapsedProjects.has(project.name);
          const folderName = project.path.split(/[\\/]/).pop() ?? '';
          const decodedPath = folderName.replace(/-/g, '\\');
          const projectNavIdx = navIndexByKey.get(`p:${project.name}`) ?? -1;
          return (
            <div key={project.name}>
              <button
                ref={el => { navItemRefs.current[projectNavIdx] = el; }}
                tabIndex={projectNavIdx === effectiveFocused ? 0 : -1}
                onFocus={() => setFocusedNavIndex(projectNavIdx)}
                onClick={() => toggleProject(project.name)}
                aria-expanded={!isCollapsed}
                title={decodedPath}
                className="flex items-center gap-1.5 w-full px-3 py-2 text-xs font-semibold uppercase text-text-muted tracking-wider hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
              >
                {isCollapsed
                  ? <ChevronRight size={12} className="shrink-0" />
                  : <ChevronDown size={12} className="shrink-0" />
                }
                <span className="truncate">{decodedPath}</span>
                <span className="ml-auto font-normal normal-case tracking-normal">{project.files.length}</span>
              </button>

              {!isCollapsed && project.files.map((conversation) => {
                const indexEntry = indexLookup.get(conversation.path);
                const convNavIdx = navIndexByKey.get(`c:${conversation.path}`) ?? -1;
                return (
                  <button
                    key={conversation.filename}
                    ref={el => { navItemRefs.current[convNavIdx] = el; }}
                    tabIndex={convNavIdx === effectiveFocused ? 0 : -1}
                    onFocus={() => setFocusedNavIndex(convNavIdx)}
                    onClick={() => onSelectConversation(conversation.path)}
                    className={`w-full text-left px-3 py-2 text-sm cursor-pointer hover:bg-surface-overlay border-l-2 flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset
                      ${conversation.path === selectedConversationId
                        ? 'border-accent bg-accent-subtle text-text-primary'
                        : 'border-transparent text-text-secondary'
                      }`}
                  >
                    <span className="truncate text-xs"><Highlight text={indexEntry?.firstMessage || conversation.filename} query={query} /></span>
                    <span className="text-xs text-text-muted">{indexEntry?.date ? formatRelativeDate(indexEntry.date) : null}</span>
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
