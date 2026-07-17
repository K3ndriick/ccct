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
  cwd?: string,
  showThinking?: boolean,
  showTools?: boolean
}

export default function AssistantMessage({ text, thinkingBlocks, toolCalls, cwd, showThinking = true, showTools = true } : AssistantMessageProps) {
  return(
    <div className="border-l-2 border-surface-border pl-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="grid place-items-center w-[18px] h-[18px] rounded-[5px] bg-surface-border-strong border border-surface-emphasis text-[10px] font-extrabold text-text-primary">C</span>
        <span className="text-xs text-text-muted">Claude</span>
      </div>
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
      {showThinking && thinkingBlocks.map((thinkingBlock, i) => (
        <ThinkingBlock key={i} text={thinkingBlock.text}/>
      ))}
      {showTools && toolCalls.map((toolCall, i) => (
        <ToolCallCard key={i} toolCall={toolCall} cwd={cwd}/>
      ))}
    </div>
  )
  
}