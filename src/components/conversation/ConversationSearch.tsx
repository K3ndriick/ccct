import { useEffect, useRef } from 'react'
import { X, ChevronUp, ChevronDown } from 'lucide-react'
import Input from '../ui/Input'
import IconButton from '../ui/IconButton'

type Props = {
  query: string
  onQueryChange: (q: string) => void
  matchCount: number
  currentMatch: number
  onNext: () => void
  onPrev: () => void
  onClose: () => void
}

export default function ConversationSearch({ query, onQueryChange, matchCount, currentMatch, onNext, onPrev, onClose }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'Enter') {
      e.shiftKey ? onPrev() : onNext()
    }
  }

  return (
    <div className="flex items-center gap-1 bg-surface-overlay border border-surface-border rounded-lg px-2 py-1">
      <Input
        ref={inputRef}
        value={query}
        onChange={e => onQueryChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Find in conversation..."
        className="flex-1 py-1 text-xs border-none bg-transparent focus-visible:ring-0 px-1"
      />
      {query && (
        <span className="text-xs text-text-muted whitespace-nowrap px-1">
          {matchCount === 0 ? 'No results' : `${currentMatch + 1} of ${matchCount}`}
        </span>
      )}
      <IconButton label="Previous match" onClick={onPrev} disabled={matchCount === 0}>
        <ChevronUp size={14} />
      </IconButton>
      <IconButton label="Next match" onClick={onNext} disabled={matchCount === 0}>
        <ChevronDown size={14} />
      </IconButton>
      <IconButton label="Close search" onClick={onClose}>
        <X size={14} />
      </IconButton>
    </div>
  )
}
