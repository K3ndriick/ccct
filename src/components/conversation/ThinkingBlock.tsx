import { useState } from "react"

interface ThinkingBlockProps {
  text: string
} 

export default function ThinkingBlock({ text } : ThinkingBlockProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <div onClick={() => setIsOpen(!isOpen)}>
        Thinking
      </div>
      
      {isOpen && <p>{text}</p>}
    </div>
  )
}
