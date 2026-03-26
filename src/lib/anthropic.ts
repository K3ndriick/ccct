import type { ParsedConversation } from "../types";

export async function generateContinuationPrompt(parsedConversation: ParsedConversation, model: string): Promise<string> {
  const payload = buildPayload(parsedConversation);

  return payload;
}



function buildPayload(conversation: ParsedConversation): string {
    const messagesText = conversation.messages.map((message) => {
      if (message.role === "user") {
        return `
        Role: ${message.role}
        Text: ${message.text}
        `
      } else {
        return `
        Role: ${message.role}
        Text: ${message.text}
        Tool calls: ${message.toolCalls.length}
        `
      }
    }).join("\n");



    return `
    Chat working directory: ${conversation.cwd}
    Model: ${conversation.model}
    Conversation started: ${conversation.firstMessageTime}
    Conversation ended: ${conversation.lastMessageTime}

    ${messagesText}
    `;
  }
