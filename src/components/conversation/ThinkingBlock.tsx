import { useState } from "react";
import { ChevronDown, ChevronRight } from 'lucide-react';

type ThinkingBlockProps = {
  text: string
} 

export default function ThinkingBlock({ text } : ThinkingBlockProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-accent-subtle border-l-2 border-accent-dim rounded-r px-3 py-2">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-accent-dim"
      >
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        Thinking
      </div>
      
      {isOpen &&
        <p className="mt-2 text-sm text-text-secondary italic">
          {text}
        </p>
      }
    </div>
  )
}
