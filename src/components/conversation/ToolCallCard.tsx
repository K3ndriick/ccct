import { useState } from "react";
import type { ToolCall } from "../../types";

interface ToolCallCardProps {
  toolCall: ToolCall
}

export default function ToolCallCard({ toolCall } : ToolCallCardProps) {
  const [isOpen, setIsOpen] = useState(toolCall.result.status === 'error');

  return(
    <div>
      <div onClick={() => setIsOpen(!isOpen)}>
        {toolCall.type}

        {(toolCall.type === "read" || toolCall.type === "edit" || toolCall.type === "write") && 
          <span>{toolCall.filePath}</span>
        }

        {toolCall.type === "bash" && 
          <span>{toolCall.command}</span>
        }
      </div>

      {isOpen && 
        <p>{toolCall.result.result}</p>
      }
    </div>
  )
}