import type { ThinkingBlock as ThinkingBlockType, ToolCall } from "../../types";
import ThinkingBlock from "./ThinkingBlock";
import ToolCallCard from "./ToolCallCard";
import ReactMarkdown from "react-markdown";

type AssistantMessageProps = {
  text?: string,
  thinkingBlocks: ThinkingBlockType[],
  toolCalls: ToolCall[]
}

export default function AssistantMessage({ text, thinkingBlocks, toolCalls } : AssistantMessageProps) {
  return(
    <div className="border-l-2 border-surface-border pl-4 flex flex-col gap-2">
      <p className="text-xs text-text-muted mb-1">Claude</p>
      {text && (
        <div className="prose prose-invert prose-sm max-w-none prose-code:before:content-none prose-code:after:content-none prose-code:bg-surface-overlay prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-surface-overlay prose-pre:border prose-pre:border-surface-border">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
      )}
      {thinkingBlocks.map((thinkingBlock, i) => (
        <ThinkingBlock key={i} text={thinkingBlock.text}/>
      ))}
      {toolCalls.map((toolCall, i) => (
        <ToolCallCard key={i} toolCall={toolCall}/>
      ))}
    </div>
  )
  
}