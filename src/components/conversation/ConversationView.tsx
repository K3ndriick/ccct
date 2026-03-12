import type { Conversation } from "../../types";
import UserMessage from "./UserMessage";
import AssistantMessage from "./AssistantMessage";

interface ConversationViewProps {
  conversation: Conversation | null
}

export default function ConversationView({ conversation } : ConversationViewProps) {
  return(
    <div>
      {conversation && (
        <div>
          {conversation.messages.map((message, i) => 
            (message.role === "assistant" 
              ? <AssistantMessage key={i} text={message.text} thinkingBlocks={message.thinkingBlocks} toolCalls={message.toolCalls}/> 
              : <UserMessage key={i} text={message.text}
              />
            ))}
        </div>
      )}
      {!conversation && (
        <p>Select a Conversation</p>
      )}
    </div>
  )
}