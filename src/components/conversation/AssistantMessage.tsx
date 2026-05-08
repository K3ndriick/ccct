import type { ThinkingBlock as ThinkingBlockType, ToolCall } from "../../types";
import ThinkingBlock from "./ThinkingBlock";
import ToolCallCard from "./ToolCallCard";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

type AssistantMessageProps = {
  text?: string,
  thinkingBlocks: ThinkingBlockType[],
  toolCalls: ToolCall[],
  cwd?: string
}

export default function AssistantMessage({ text, thinkingBlocks, toolCalls, cwd } : AssistantMessageProps) {
  return(
    <div className="border-l-2 border-surface-border pl-4 flex flex-col gap-2">
      <p className="text-xs text-text-muted mb-1">Claude</p>
      {text && (
        <div className="prose prose-invert prose-sm max-w-none prose-code:before:content-none prose-code:after:content-none prose-code:bg-surface-overlay prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:p-0 prose-pre:bg-transparent prose-pre:border-0">
          <ReactMarkdown
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const isBlock = !!match;
                return isBlock ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{ borderRadius: '6px', fontSize: '13px', margin: 0 }}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>{children}</code>
                );
              }
            }}
          >{text}</ReactMarkdown>
        </div>
      )}
      {thinkingBlocks.map((thinkingBlock, i) => (
        <ThinkingBlock key={i} text={thinkingBlock.text}/>
      ))}
      {toolCalls.map((toolCall, i) => (
        <ToolCallCard key={i} toolCall={toolCall} cwd={cwd}/>
      ))}
    </div>
  )
  
}