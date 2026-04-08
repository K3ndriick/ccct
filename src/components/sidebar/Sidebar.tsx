import { RefreshCcw } from "lucide-react";
import type { ProjectEntry } from "../../types";

interface SidebarProps {
  projects: ProjectEntry[] | null,
  selectedConversationId: string | null,
  onSelectConversation: (id: string) => void
}

export default function Sidebar({ projects, selectedConversationId, onSelectConversation } : SidebarProps) {

  if (!projects) {
    return (<p>Loading...</p>)
  }
  
  return (
  <div className="h-full flex flex-col">
    {projects.map((project) => (
      <div key={project.name} className="mb-4">
        <p className="px-3 py-2 text-xs font-semibold uppercase text-text-muted tracking-wider">{project.name}</p>

        {project.files.map((conversation) => (
          <div 
          key={conversation.filename}
          onClick={() => onSelectConversation(conversation.path)}
          className={`px-3 py-2 text-sm cursor-pointer hover:bg-surface-overlay border-l-2 flex flex-col
            ${conversation.path === selectedConversationId
              ? 'border-accent bg-accent-subtle text-text-primary'
              : 'border-transparent text-text-secondary'
            }`}
          >
            <span>{conversation.filename}</span>
            
          </div>
        ))}
      </div>
    ))}
    <button className="mt-auto text-text-muted flex items-center gap-2 border-t border-surface-border px-3 py-3 w-full">
      <RefreshCcw size={14}/>
      Re-index
    </button>
  </div>
  )
}