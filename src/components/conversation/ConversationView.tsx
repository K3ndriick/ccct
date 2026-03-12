import type { Conversation } from "../../types";

interface ConversationViewProps {
  conversation: Conversation | null
}

export default function ConversationView({ conversation } : ConversationViewProps) {
  return(
    <div>
      {conversation && (
        <p>
          {conversation.messages.length}
        </p>
      )}
      {!conversation && (
        <p>Select a Conversation</p>
      )}
    </div>
  )
}