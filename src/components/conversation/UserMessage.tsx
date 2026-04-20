type UserMessageProps = {
  text: string
}

export default function UserMessage({ text } : UserMessageProps) {
  return(
    <div className="ml-auto max-w-[80%] bg-surface-overlay border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary">
      <p className="text-xs text-text-muted mb-1">You</p>
      <p>{text}</p>
    </div>
  )
}