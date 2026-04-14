import type { ParsedConversation } from "../../types";
import UserMessage from "./UserMessage";
import AssistantMessage from "./AssistantMessage";
import { MessageSquare } from "lucide-react";

type ConversationViewProps = {
  conversation: ParsedConversation | null
}

export default function ConversationView({ conversation } : ConversationViewProps) {
  return(
    <div className="h-full p-6 overflow-y-auto">
      {conversation && (
        <div className="flex flex-col gap-4">
          {conversation.messages.map((message, i) =>
            (message.role === "assistant"
              ? <AssistantMessage key={i} text={message.text} thinkingBlocks={message.thinkingBlocks} toolCalls={message.toolCalls}/>
              : <UserMessage key={i} text={message.text}
              />
            ))}
        </div>
      )}
      {!conversation && (
        <div className="flex flex-col items-center justify-center h-full gap-2">
          <MessageSquare size={32} className="text-text-muted" />
          <p className="text-sm font-medium text-text-secondary">Select a conversation</p>
          <p className="text-xs text-text-muted">Pick a session from the sidebar to view it here.</p>
        </div>
      )}
    </div>
  )
}