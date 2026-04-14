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
        <div className="text-text-primary text-sm leading-relaxed [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_li]:mb-1 [&_code]:font-mono [&_code]:text-xs [&_code]:bg-surface-overlay [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-surface-overlay [&_pre]:p-3 [&_pre]:rounded-md [&_pre]:overflow-x-auto [&_pre]:mb-2 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_a]:text-text-secondary [&_a]:underline [&_strong]:font-semibold [&_blockquote]:border-l-2 [&_blockquote]:border-surface-border [&_blockquote]:pl-3 [&_blockquote]:text-text-muted">
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