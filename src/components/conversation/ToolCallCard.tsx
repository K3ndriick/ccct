import { useState } from "react";
import type { ToolCall } from "../../types";
import { ChevronDown, ChevronRight } from 'lucide-react';
import Card from "../ui/Card";
import ToolIcon from "./ToolIcon";
import DiffView from "./DiffView";

type ToolCallCardProps = {
  toolCall: ToolCall
}

export default function ToolCallCard({ toolCall } : ToolCallCardProps) {
  const [isOpen, setIsOpen] = useState(toolCall.result.status === 'error');

  return(
    <Card>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 cursor-pointer text-sm text-text-secondary"
      >
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <ToolIcon type={toolCall.type} />
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
    </Card>
  )
}
