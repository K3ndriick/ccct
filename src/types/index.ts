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

// types for the parser
export type RawRecord = {
	uuid: string,
  parentUuid: string | null,
  sessionId: string,
  timestamp: string,
  type: string,
	message?: {
		role: "user" | "assistant",
		content: string | ContentBlock[],
		model?: string,
		id?: string,
		stop_reason?: string,
		usage?: {
			input_tokens?: number,
			output_tokens?: number,
			cache_creation_input_tokens?: number,
			cache_read_input_tokens?: number
    }
  },
  toolUse?: {
    id: string,
    name: string,
    input: Record<string, unknown>
  },
  toolUseResult?: {
    tool_use_id: string,
    content: string,
    stderr?: string,
    is_error?: boolean
  },
  isMeta?: boolean,
  isSidechain?: boolean,
	summary?: string,
	cwd?: string
}

export type ParsedConversation = {
  sessionId: string,
  cwd?: string,
  model?: string,
  firstMessageTime: string,
  lastMessageTime: string,
  messages: Message[]
}

export type ContentBlock =
  | { type: "text";     text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
