import type { Project } from "../../types";

interface SidebarProps {
  projects: Project[],
  selectedConversationId: string | null,
  onSelectConversation: (id: string) => void
}

export default function Sidebar({ projects, selectedConversationId, onSelectConversation } : SidebarProps) {
  return (
  <div>
    {projects.map((project) => (
      <div key={project.name}>
        <p>{project.name}</p>
        {project.conversations.map((convo) => (
          <p key={convo.id} onClick={() => onSelectConversation(convo.id)}>{convo.projectSlug}</p>
        ))}
      </div>
    ))}
  </div>
  )
}