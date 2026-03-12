import type { ThinkingBlock as ThinkingBlockType, ToolCall } from "../../types";
import ThinkingBlock from "./ThinkingBlock";

interface AssistantMessageProps {
  text?: string,
  thinkingBlocks: ThinkingBlockType[],
  toolCalls: ToolCall[]
}

export default function AssistantMessage({ text, thinkingBlocks, toolCalls } : AssistantMessageProps) {
  return(
    <div>
      <p>{text}</p>      
      {thinkingBlocks.map((thinkingBlock, i) => (
        <ThinkingBlock key={i} text={thinkingBlock.text}/>
      ))}
      {toolCalls.map((toolCall, i) => (
        <p key={i}>{toolCall.type}</p>
      ))}
    </div>
  )
  
}