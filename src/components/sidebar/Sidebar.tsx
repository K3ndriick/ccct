import type { Project } from "../../types";

interface SidebarProps {
  projects: Project[],
  selectedConversationId: string | null,
  onSelectConversation: (id: string) => void
}

export default function Sidebar({ projects, selectedConversationId, onSelectConversation } : SidebarProps) {
  return (
  <div className="h-full flex flex-col">
    {projects.map((project) => (
      <div key={project.name} className="mb-4">
        <p className="px-3 py-2 text-xs font-semibold uppercase text-text-muted tracking-wider">{project.name}</p>

        {project.conversations.map((convo) => (
          <p 
          key={convo.id}
          onClick={() => onSelectConversation(convo.id)}
          className={`px-3 py-2 text-sm cursor-pointer hover:bg-surface-overlay border-l-2 
            ${convo.id === selectedConversationId
              ? 'border-accent bg-accent-subtle text-text-primary'
              : 'border-transparent text-text-secondary'
            }`}
          >
            {convo.projectSlug}
          </p>
        ))}
      </div>
    ))}
  </div>
  )
}