import type { ToolCall } from "../../../types"
import BashResultRenderer from "./BashResultRenderer"
import EditResultRenderer from "./EditResultRenderer"
import FileResultRenderer from "./FileResultRenderer"
import FallbackRenderer from "./FallbackRenderer"

type Props = { toolCall: ToolCall }

export default function ToolResultRenderer({ toolCall }: Props) {
  const { result } = toolCall
  const isError = result.status === 'error'

  switch (toolCall.type) {
    case 'bash':
      return <BashResultRenderer result={result.result} isError={isError} />
    case 'read':
    case 'write':
      return <FileResultRenderer result={result.result} isError={isError} />
    case 'edit':
      return <EditResultRenderer oldString={toolCall.oldString} newString={toolCall.newString} result={result.result} isError={isError} />
    default:
      return <FallbackRenderer result={result.result} isError={isError} />
  }
}
