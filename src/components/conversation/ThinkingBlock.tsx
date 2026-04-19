import { useState } from "react";
import { ChevronDown, ChevronRight } from 'lucide-react';

type ThinkingBlockProps = {
  text: string
} 

export default function ThinkingBlock({ text } : ThinkingBlockProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-accent-subtle border-l-2 border-accent-dim rounded-r px-3 py-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-accent-dim w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
      >
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        Thinking
      </button>
      
      <div className={`grid transition-all duration-150 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <p className="mt-2 text-sm text-text-secondary italic">{text}</p>
        </div>
      </div>
    </div>
  )
}
