import type { ContentBlock, Message, ParsedConversation, RawRecord, ThinkingBlock, ToolResult } from "../types";

export function parseJsonl(raw: string): ParsedConversation {
  // STEP 1: PARSE AND FILTER
  // records array splits raw input by each new line
  // then trim to exclude empty lines
  // then parse them into RawRecord type JSON
  const records = raw
    .split("\n")
    .filter(line => line.trim() !== "")
    .map(line => JSON.parse(line) as RawRecord);

  // filter for records:
  // 1. keeping user/assistant type records
  // 2. skipping records withoyt isMeta and isSideChain
  const filteredRecordsJson = records.filter(record => 
    (record.type === 'user' || record.type === 'assistant')
    && !record.isMeta
    && !record.isSidechain
  )



  // STEP 2: METADATA EXTRACTION
  const sessionId = filteredRecordsJson[0].sessionId;
  const cwd = filteredRecordsJson[0].cwd;
  const firstMessageTime = filteredRecordsJson[0].timestamp;
  const lastMessageTime = filteredRecordsJson[filteredRecordsJson.length - 1].timestamp;
  const model = filteredRecordsJson.find(record => record.type === "assistant")?.message?.model;



  // STEP 3: HANDLING USER & ASSISTANT RECORDS
  // messages array to contain our final messages
  // pendingToolCalls as our lookup map
  const messages: Message[] = [];
  const pendingToolCalls = new Map<string, { block: ContentBlock & { type: 'tool_use' }, messageIndex: number }>();

  // state variables - declared here so they persist across records
  let currentMessageId: string | null = null;
  let currentTextBlocks: string[] = [];
  let currentThinkingBlocks: ThinkingBlock[] = [];
  let currentToolUseBlocks: (ContentBlock & { type: "tool_use" })[] = [];


  // flush function
  function flush() {
    if (currentMessageId === null) return; // safety guard to exit early

    const messageIndex = messages.length;
    messages.push({
      role: "assistant",
      text: currentTextBlocks.join("\n") || undefined,
      thinkingBlocks: currentThinkingBlocks,
      toolCalls: []
    })

    currentToolUseBlocks.forEach((block) => {
      pendingToolCalls.set(block.id, { block, messageIndex })
    })

    // reset
    currentMessageId = null;
    currentTextBlocks = [];
    currentThinkingBlocks = [];
    currentToolUseBlocks = [];
  }


  filteredRecordsJson.forEach((record) => {
    const messageContent = record.message?.content;

    // CASE A: assistant record
    if (record.type === 'assistant') {
      if (Array.isArray(messageContent)) {
        if (record.message?.id !== currentMessageId) {
          flush();

          currentMessageId = record.message?.id ?? null;
        }

        messageContent.forEach(contentBlock => {
          if (contentBlock.type === "text") {
            currentTextBlocks.push(contentBlock.text);
          } else if (contentBlock.type === "thinking") {
            currentThinkingBlocks.push({ text: contentBlock.thinking });
          } else if (contentBlock.type === "tool_use") {
            currentToolUseBlocks.push(contentBlock);
          }
        });

      }
    }

    // CASE B: user records
    else if (record.type === "user") {
      flush(); // ensure any pending assistant turn is emitted first

      // grab the contentBlock section
      // we can assume content[0] here because Claude Code streams one block per record into data logs
      // means there will always only be one block in the "content" section of the log structure
      const contentBlock = record.message?.content[0];

      // CASE B1: user record where content[0].type === "text"
      if (contentBlock?.type === "text") {
        if (Array.isArray(messageContent)) {
          const text = messageContent
            .filter((block): block is { type: "text"; text: string } => block.type === "text" && !block.text.startsWith("<ide_"))
            .map(block => block.text)
            .join("\n");

          // true if there's actual content after stripping whitespace
          // false if the string is "" or "   " (only whitespace)
          if (text.trim()) {
            messages.push({ role: "user", text })
          };
        }
      }


      // CASE B2: user record where content[0].type === "tool_result"
      else if (contentBlock?.type === "tool_result") {
        // retrieve { block, messageIndex } object from lookup map via tool_use_id
        const toolCallToMatch = pendingToolCalls.get(contentBlock.tool_use_id);

        if (!toolCallToMatch) return;

        const toolResult: ToolResult = {
          status: contentBlock.is_error ? 'error' : 'success',
          result: contentBlock.content
        }

        const targetMessage = messages[toolCallToMatch.messageIndex];
        if (targetMessage.role !== "assistant") return;

        // switch case for tool call types
        switch (toolCallToMatch.block.name) {
          case "Read":
            targetMessage.toolCalls.push({
              type: 'read',
              filePath: toolCallToMatch.block.input.file_path as string,
              result: toolResult
            })
            break;

          case "Write":
            targetMessage.toolCalls.push({
              type: "write",
              filePath: toolCallToMatch.block.input.file_path as string,
              result: toolResult,
            });
            break;

          case "Edit":
            targetMessage.toolCalls.push({
              type: 'edit',
              filePath: toolCallToMatch.block.input.file_path as string,
              result: toolResult,
              diff: toolCallToMatch.block.input.new_string as string
            })
            break;

          case "Bash":
            targetMessage.toolCalls.push({
              type: 'bash',
              result: toolResult,
              command: toolCallToMatch.block.input.command as string
            })
            break;

          case "Glob":
            targetMessage.toolCalls.push({
              type: 'glob',
              result: toolResult,
              pattern: toolCallToMatch.block.input.pattern as string
            })
            break;

          default:
            break;
        }
      }
    }
  })
  flush();

  return {
    sessionId,
    cwd,
    model,
    firstMessageTime,
    lastMessageTime,
    messages
  }
}
