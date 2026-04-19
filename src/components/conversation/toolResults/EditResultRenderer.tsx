import DiffView from "../DiffView"

type Props = { oldString: string; newString: string; result: string; isError: boolean }

export default function EditResultRenderer({ oldString, newString, result, isError }: Props) {
  return (
    <div className="border-t border-surface-border">
      {isError
        ? <p className="px-3 py-2 text-xs font-mono text-status-error">{result}</p>
        : <DiffView oldString={oldString} newString={newString} />
      }
    </div>
  )
}
