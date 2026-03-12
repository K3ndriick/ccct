export type ThinkingBlock = {
	text: string
}

export type ToolResult = {
	status: "success" | "error",
	result: string
}

type ToolCallBase = {
  result: ToolResult
}

export type ToolCall =
  | ToolCallBase & { type: 'read';  filePath: string }
  | ToolCallBase & { type: 'edit';  filePath: string; diff: string }
  | ToolCallBase & { type: 'bash';  command: string }
  | ToolCallBase & { type: 'glob';  pattern: string }
	| ToolCallBase & { type: 'write'; filePath: string }

export type Message = 
	| { role: 'user'; text: string }
	| { role: 'assistant'; text?: string; thinkingBlocks: ThinkingBlock[]; toolCalls: ToolCall[]}

export type Conversation = {
	id: string,
	projectName: string,
	projectSlug: string,
	projectDate: string,
	messages: Message[]
}

export type Project = {
	name: string,
	conversations: Conversation[]
}