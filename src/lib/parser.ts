import type { ContentBlock, Message, ParsedConversation, RawRecord, ThinkingBlock } from "../types";

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

  const messages: Message[] = [];
  const pendingToolCalls = new Map<string, ContentBlock & { type: 'tool_use' }>();

  filteredRecordsJson.forEach((record) => {
    const content = record.message?.content;

    // handle user and assistant records
    if (record.type === "user" && typeof content === 'string') {
      messages.push({ role: "user", text: content })
    }
    
    // else if (record.type === 'assistant') {
    //   if (Array.isArray(content)) {
    //     const textBlocks: string[] = [];
    //     const thinkingBlocks: ThinkingBlock[] = [];
    //     const toolUserBlocks: (ContentBlock & { type: "tool_use"})[] = [];

    //     content.forEach(block => {
    //       if (block.type === "text") {
    //         textBlocks.push(block.text);
    //       } else if (block.type === "thinking") {
    //         thinkingBlocks.push({ text: block.thinking });
    //       } else if (block.type === "tool_use") {
    //         toolUserBlocks.push(block);
    //       }
    //     });
    //   }
    //   if (record.toolUseResult)

    // }
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