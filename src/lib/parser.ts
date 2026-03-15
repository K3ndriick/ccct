import type { ParsedConversation, RawRecord } from "../types";

export function parseJsonl(raw: string): ParsedConversation {
  const records = raw.split("\n");
  const recordsJson = records.filter(line => line.trim() !== "").map(line => JSON.parse(line) as RawRecord);

  const filteredRecordsJson = recordsJson.filter(record => 
    (record.type === 'user' || record.type === 'assistant')
    && !record.isMeta
    && !record.isSidechain
  )

  const sessionId = filteredRecordsJson[0].sessionId;
  const cwd = filteredRecordsJson[0].cwd;
  const firstMessageTime = filteredRecordsJson[0].timestamp;
  const lastMessageTime = filteredRecordsJson[filteredRecordsJson.length - 1].timestamp;

  const model = filteredRecordsJson.find(record => record.type === "assistant")?.message?.model;
  
  return {
    sessionId,
    cwd,
    model,
    firstMessageTime,
    lastMessageTime,
    messages: []
  }
}