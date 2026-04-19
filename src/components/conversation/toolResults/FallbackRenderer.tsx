type Props = { result: string; isError: boolean }

function tryPrettyJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

export default function FallbackRenderer({ result, isError }: Props) {
  return (
    <pre className={`px-3 py-2 text-xs font-mono whitespace-pre-wrap break-words max-h-72 overflow-y-auto border-t border-surface-border ${
      isError ? 'text-status-error' : 'text-text-secondary'
    }`}>
      {tryPrettyJson(result) || '(no output)'}
    </pre>
  )
}
