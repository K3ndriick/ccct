import type { ParsedConversation } from "../types";
import Anthropic from "@anthropic-ai/sdk";

export async function generateContinuationPrompt(parsedConversation: ParsedConversation, model: string): Promise<string> {
  const payload = buildPayload(parsedConversation);

  const client = new Anthropic({
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY
  });

  try {
    const response = await client.messages.create({
      max_tokens: 4096,
      messages: [{ role: "user", content: payload }],
      model: model
    })

    const block = response.content[0];

    if (block.type === "text") {
      return block.text;
    }
  } catch (error) {
    if (error instanceof Anthropic.BadRequestError) {
      throw new Error(`Bad request: ${error.message}`);
    } else if (error instanceof Anthropic.AuthenticationError) {
      throw new Error(`Invalid API key`);
    } else if (error instanceof Anthropic.RateLimitError) {
      throw new Error(`Rate limited - retry later`);
    } else if (error instanceof Anthropic.APIError) {
      throw new Error(`API error ${error.status}: ${error.message}`);
    }
  }

  throw new Error("No text block in response");
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
