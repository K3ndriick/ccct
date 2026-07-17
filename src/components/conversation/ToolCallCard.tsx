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

const chipClass: Record<ToolCall['type'], string> = {
  read:  'bg-tool-read/15 border-tool-read/30',
  write: 'bg-tool-write/15 border-tool-write/30',
  edit:  'bg-tool-edit/15 border-tool-edit/30',
  bash:  'bg-tool-bash/15 border-tool-bash/30',
  glob:  'bg-tool-glob/15 border-tool-glob/30',
};

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
        <span className={`grid place-items-center w-5 h-5 rounded-md border flex-shrink-0 ${chipClass[toolCall.type]}`}>
          <ToolIcon type={toolCall.type} size={12} />
        </span>
        <span className="font-medium text-text-primary capitalize">{toolCall.type}</span>

        {(toolCall.type === "read" || toolCall.type === "edit" || toolCall.type === "write") &&
          <span className="truncate text-text-muted" title={toolCall.filePath}>
            {toRelativePath(toolCall.filePath, cwd)}
          </span>
        }

        {toolCall.type === "bash" &&
          <span>{toolCall.command}</span>
        }

        <span
          className={`ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            toolCall.result.status === 'error' ? 'bg-status-error' : 'bg-status-success'
          }`}
        />
      </button>

      <div className={`grid transition-all duration-150 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <ToolResultRenderer toolCall={toolCall} />
        </div>
      </div>
    </Card>
  )
}
