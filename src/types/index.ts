export type ToolCall =
  | { type: 'read';  filePath: string }
  | { type: 'edit';  filePath: string; diff: string }
  | { type: 'bash';  command: string }
  | { type: 'glob';  pattern: string }
	| { type: 'write'; filePath: string;}

export type ToolResult = {
	status: "success" | "error"
}