import { useState } from "react";
import type { ToolCall } from "../../types";
import { ChevronDown, ChevronRight } from 'lucide-react';
import Card from "../ui/Card";
import ToolIcon from "./ToolIcon";
import ToolResultRenderer from "./toolResults";

type ToolCallCardProps = {
  toolCall: ToolCall
  cwd?: string
}

function toRelativePath(filePath: string, cwd?: string): string {
  if (!cwd) return filePath.split(/[\\/]/).pop() ?? filePath;
  const cwdParent = cwd.replace(/[\\/][^\\/]+$/, '');
  if (filePath.startsWith(cwdParent)) {
    return filePath.slice(cwdParent.length).replace(/^[\\/]/, '');
  }
  return filePath.split(/[\\/]/).pop() ?? filePath;
}

export default function ToolCallCard({ toolCall, cwd } : ToolCallCardProps) {
  const [isOpen, setIsOpen] = useState(toolCall.result.status === 'error');

  return(
    <Card>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex items-center gap-2 px-3 py-2 cursor-pointer text-sm text-text-secondary w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md"
      >
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <ToolIcon type={toolCall.type} />
        {toolCall.type}

        {(toolCall.type === "read" || toolCall.type === "edit" || toolCall.type === "write") &&
          <span className="truncate text-text-muted" title={toolCall.filePath}>
            {toRelativePath(toolCall.filePath, cwd)}
          </span>
        }

        {toolCall.type === "bash" &&
          <span>{toolCall.command}</span>
        }
      </button>

      <div className={`grid transition-all duration-150 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <ToolResultRenderer toolCall={toolCall} />
        </div>
      </div>
    </Card>
  )
}
