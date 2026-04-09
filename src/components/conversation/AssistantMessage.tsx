import type { ThinkingBlock as ThinkingBlockType, ToolCall } from "../../types";
import ThinkingBlock from "./ThinkingBlock";
import ToolCallCard from "./ToolCallCard";

type AssistantMessageProps = {
  text?: string,
  thinkingBlocks: ThinkingBlockType[],
  toolCalls: ToolCall[]
}

export default function AssistantMessage({ text, thinkingBlocks, toolCalls } : AssistantMessageProps) {
  return(
    <div className="border-l-2 border-surface-border pl-4 flex flex-col gap-2">
      <p className="text-xs text-text-muted mb-1">Claude</p>
      <p>{text}</p>      
      {thinkingBlocks.map((thinkingBlock, i) => (
        <ThinkingBlock key={i} text={thinkingBlock.text}/>
      ))}
      {toolCalls.map((toolCall, i) => (
        <ToolCallCard key={i} toolCall={toolCall}/>
      ))}
    </div>
  )
  
}