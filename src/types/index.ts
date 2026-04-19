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
  | ToolCallBase & { type: 'edit';  filePath: string; oldString: string; newString: string }
  | ToolCallBase & { type: 'bash';  command: string }
  | ToolCallBase & { type: 'glob';  pattern: string }
	| ToolCallBase & { type: 'write'; filePath: string }

export type Message = 
	| { role: 'user'; text: string }
	| { role: 'assistant'; text?: string; thinkingBlocks: ThinkingBlock[]; toolCalls: ToolCall[] }

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
  type: string, // "user", "assistant", "queue-operation", "progress"
	message?: {
		role: "user" | "assistant",
		content: ContentBlock[],
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
  toolUseResult?: string | Record<string, unknown>,
  sourceToolAssistantUUID?: string
  isMeta?: boolean,
  isSidechain?: boolean,
	summary?: string,
  slug?: string,
  gitBranch?: string,
  version?: string,
  requestId?: string,
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
  | { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean }

// types for reading from disk
export type ConversationEntry = {
  path: string,
  filename: string
}

export type ProjectEntry = {
  name: string,
  path: string,
  files: ConversationEntry[]
}

export type Settings = {
  claudeDir: string,
  autoIndex: boolean
}