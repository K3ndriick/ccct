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

    // assistant records
    if (record.type === 'assistant') {
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

    // user records
    else if (record.type === "user") {
      // grab the contentBlock section
      // we can assume content[0] here because Claude Code streams one block per record into data logs
      // means there will always only be one block in the "content" section of the log structure
      const contentBlock = record.message?.content[0];

      // CASE A: user record where content[0].type === "tool_result"
      if (contentBlock?.type === "tool_result") {
        const pendingCallToMatch = pendingToolCalls.get(contentBlock.tool_use_id);

        if (!pendingCallToMatch) return;

        const toolResult: ToolResult = {
          status: contentBlock.is_error ? 'error' : 'success',
          result: contentBlock.content
        }


        

        // switch case for tool call types
        // switch (pendingCallToMatch.name) {
        //   case "Read":
        //     lastMessage.toolCalls.push({
        //       type: 'read',
        //       filePath: pendingCallToMatch.input.file_path as string,
        //       result: toolResult
        //     })
        //     break;

        //   case "Edit":
        //     lastMessage.toolCalls.push({
        //       type: 'edit',
        //       filePath: pendingCallToMatch.input.file_path as string,
        //       result: toolResult,
        //       diff: pendingCallToMatch.input.diff as string
        //     })
        //     break;

        //   case "Bash":
        //     lastMessage.toolCalls.push({
        //       type: 'bash',
        //       result: toolResult,
        //       command: pendingCallToMatch.input.command as string
        //     })
        //     break;

        //   case "Glob":
        //     lastMessage.toolCalls.push({
        //       type: 'glob',
        //       result: toolResult,
        //       pattern: pendingCallToMatch.input.pattern as string
        //     })
        //     break;

        //   default:
        //     break;
        // }

      }
        





      

      // else if (Array.isArray(messageContent)) {
      //   const text = messageContent
      //     .filter(block => block.type === "text")
      //     .map(block => block.text)
      //     .join("\n");

      //   messages.push({ role: "user", text });
      // }

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
