type Props = { result: string; isError: boolean }

export default function BashResultRenderer({ result, isError }: Props) {
  return (
    <pre className={`px-3 py-2 text-xs font-mono whitespace-pre-wrap break-words max-h-72 overflow-y-auto border-t border-surface-border ${
      isError ? 'text-status-error' : 'text-text-secondary'
    }`}>
      {result || '(no output)'}
    </pre>
  )
}
