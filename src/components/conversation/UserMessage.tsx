type UserMessageProps = {
  text: string
}

export default function UserMessage({ text } : UserMessageProps) {
  return(
    <div className="ml-auto max-w-[80%] bg-surface-overlay border border-surface-border rounded-tl-[13px] rounded-tr-[13px] rounded-br-[4px] rounded-bl-[13px] px-4 py-3 text-sm text-text-primary">
      <p className="text-xs text-text-faint mb-1">You</p>
      <p className="whitespace-pre-wrap">{text}</p>
    </div>
  )
}