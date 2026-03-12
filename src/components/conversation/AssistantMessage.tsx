import type { ThinkingBlock, ToolCall } from "../../types";

interface AssistantMessageProps {
  text?: string,
  thinkingBlocks: ThinkingBlock[],
  toolCalls: ToolCall[]
}

export default function AssistantMessage({ text, thinkingBlocks, toolCalls } : AssistantMessageProps) {
  return(
    <div>
      <p>{text}</p>      
      {thinkingBlocks.map((thinkingBlock, i) => (
        <p key={i}>Thinking block</p>
      ))}
      {toolCalls.map((toolCall, i) => (
        <p key={i}>{toolCall.type}</p>
      ))}
    </div>
  )
  
}