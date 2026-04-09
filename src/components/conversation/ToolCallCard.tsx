import { useState } from "react";
import type { ToolCall } from "../../types";
import { ChevronDown, ChevronRight, FilePen, FilePlus, FileText, Search, Terminal } from 'lucide-react';
import DiffView from "./DiffView";

type ToolCallCardProps = {
  toolCall: ToolCall
}

const iconMap = {
  read: { icon: FileText, color: "#3b82f6" },
  write: { icon: FilePlus, color: "#22c55e" },
  edit: { icon: FilePen, color: "#eab308" },
  bash: { icon: Terminal, color: "#f97316" },
  glob: { icon: Search, color: "#6b7280" },
}

export default function ToolCallCard({ toolCall } : ToolCallCardProps) {
  const [isOpen, setIsOpen] = useState(toolCall.result.status === 'error');
  const { icon: Icon, color } = iconMap[toolCall.type];


  return(
    <div className="bg-surface-raised border border-surface-border rounded-md overflow-hidden">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 cursor-pointer text-sm text-text-secondary"
      >
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Icon size={14} color={color}/>
        {toolCall.type}

        {(toolCall.type === "read" || toolCall.type === "edit" || toolCall.type === "write") && 
          <span>{toolCall.filePath}</span>
        }

        {toolCall.type === "bash" && 
          <span>{toolCall.command}</span>
        }
      </div>

      {isOpen &&
      <>
        <p className="px-3 py-2 text-xs font-mono text-text-secondary border-t border-surface-border">
          {toolCall.result.result}
        </p>
        {toolCall.type === "edit" && <DiffView diff={toolCall.diff}/>}
      </>
      }
    </div>
  )
}