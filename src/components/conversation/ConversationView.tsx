import type { Conversation } from "../../types";
import UserMessage from "./UserMessage";
import AssistantMessage from "./AssistantMessage";

interface ConversationViewProps {
  conversation: Conversation | null
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
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-text-muted">Select a conversation</p>
        </div>
      )}
    </div>
  )
}