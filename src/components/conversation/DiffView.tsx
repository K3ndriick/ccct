interface DiffViewProps {
  diff: string
}

export default function DiffView({ diff } : DiffViewProps) {
  const lines = diff.split("\n");
  return (
    <div>
      {lines.map((line, i) => 
        <div 
        key={i}
        className={`font-mono text-xs px-2 py-0.5 ${
          line.startsWith('+') ? 'bg-[#1a2e1a] text-[#22c55e]' :
          line.startsWith('-') ? 'bg-[#2e1a1a] text-[#ef4444]' :
          'bg-surface-raised text-text-muted'
        }`}>
          {line}
        </div>
      )}
    </div>
  )
}