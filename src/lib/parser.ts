import type { ContentBlock, Message, ParsedConversation, RawRecord, ThinkingBlock, ToolResult } from "../types";

export function parseJsonl(raw: string): ParsedConversation {
  // records array that stores split records by each new line
  const records = raw.split("\n");
  // trim to exclude empty lines then parse them into RawRecord type JSON
  const recordsJson = records.filter(line => line.trim() !== "").map(line => JSON.parse(line) as RawRecord);

  // filter for user/assistant and skip isMeta and isSideChain
  const filteredRecordsJson = recordsJson.filter(record => 
    (record.type === 'user' || record.type === 'assistant')
    && !record.isMeta
    && !record.isSidechain
  )

  // extracting our metadata
  const sessionId = filteredRecordsJson[0].sessionId;
  const cwd = filteredRecordsJson[0].cwd;
  const firstMessageTime = filteredRecordsJson[0].timestamp;
  const lastMessageTime = filteredRecordsJson[filteredRecordsJson.length - 1].timestamp;
  const model = filteredRecordsJson.find(record => record.type === "assistant")?.message?.model;

  // Beginning of code for chunk 4 - message building
  const messages: Message[] = [];
  const pendingToolCalls = new Map<string, ContentBlock & { type: 'tool_use' }>();

  filteredRecordsJson.forEach((record) => {
    const messageContent = record.message?.content;

    // handle user and assistant records
    if (record.type === "user") {
      if (record.toolUseResult) {
        const pendingCallToMatch = pendingToolCalls.get(record.toolUseResult.tool_use_id);

        if (!pendingCallToMatch) return;

        const toolResult: ToolResult = {
          status: record.toolUseResult.is_error ? 'error' : 'success',
          result: record.toolUseResult.content
        }

        const lastMessage = messages[messages.length -1];

        if (lastMessage.role !== "assistant") return;

        // switch case for tool call types
        switch (pendingCallToMatch.name) {
          case "Read":
            lastMessage.toolCalls.push({
              type: 'read',
              filePath: pendingCallToMatch.input.file_path as string,
              result: toolResult
            })
            break;

          case "Edit":
            lastMessage.toolCalls.push({
              type: 'edit',
              filePath: pendingCallToMatch.input.file_path as string,
              result: toolResult,
              diff: pendingCallToMatch.input.diff as string
            })
            break;

          case "Bash":
            lastMessage.toolCalls.push({
              type: 'bash',
              result: toolResult,
              command: pendingCallToMatch.input.command as string
            })
            break;

          case "Glob":
            lastMessage.toolCalls.push({
              type: 'glob',
              result: toolResult,
              pattern: pendingCallToMatch.input.pattern as string
            })
            break;

          default:
            break;
        }
      }

      else if (Array.isArray(messageContent)) {
        const text = messageContent
          .filter(block => block.type === "text")
          .map(block => block.text)
          .join("\n");

        messages.push({ role: "user", text });
      }

    }
    
    else if (record.type === 'assistant') {
      if (Array.isArray(messageContent)) {
        // create separate block arrays
        const textBlocks: string[] = [];
        const thinkingBlocks: ThinkingBlock[] = [];
        const toolUseBlocks: (ContentBlock & { type: "tool_use"})[] = [];

        messageContent.forEach(contentBlock => {
          if (contentBlock.type === "text") {
            textBlocks.push(contentBlock.text);
          } else if (contentBlock.type === "thinking") {
            thinkingBlocks.push({ text: contentBlock.thinking });
          } else if (contentBlock.type === "tool_use") {
            toolUseBlocks.push(contentBlock);
          }
        });

        // mapping incoming tool calls as we wait for tool call results
        toolUseBlocks.forEach(block => {
          pendingToolCalls.set(block.id, block);
        });

        messages.push({
          role: 'assistant',
          text: textBlocks.join("\n") || undefined,
          thinkingBlocks,
          toolCalls: []
        });
      }
    }
  })
  
  return {
    sessionId,
    cwd,
    model,
    firstMessageTime,
    lastMessageTime,
    messages
  }
}