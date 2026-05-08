import { FolderOpen, Calendar, Cpu, MessageSquare } from 'lucide-react'
import type { ParsedConversation } from '../../types'

type Props = { conversation: ParsedConversation }

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function shortCwd(cwd: string) {
  const parts = cwd.replace(/\\/g, '/').split('/')
  return parts.slice(-2).join('/')
}

export default function ConversationHeader({ conversation }: Props) {
  const messageCount = conversation.messages.length

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1">
      {conversation.cwd && (
        <span className="flex items-center gap-1.5 text-xs text-text-muted" title={conversation.cwd}>
          <FolderOpen size={12} className="shrink-0" />
          {shortCwd(conversation.cwd)}
        </span>
      )}
      <span className="flex items-center gap-1.5 text-xs text-text-muted">
        <Calendar size={12} className="shrink-0" />
        {formatDate(conversation.firstMessageTime)}
      </span>
      {conversation.model && (
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          <Cpu size={12} className="shrink-0" />
          {conversation.model}
        </span>
      )}
      <span className="flex items-center gap-1.5 text-xs text-text-muted">
        <MessageSquare size={12} className="shrink-0" />
        {messageCount} {messageCount === 1 ? 'message' : 'messages'}
      </span>
    </div>
  )
}
