import type { ParsedConversation } from "../types";
import Anthropic from "@anthropic-ai/sdk";

// generateContinuationPrompt
// takes a parsed conversation and a model string
// builds a plain-text payload, sends it to the Anthropic API, returns the generated prompt as a string
export async function generateContinuationPrompt(parsedConversation: ParsedConversation, model: string): Promise<string> {

  // STEP 1: BUILD PAYLOAD
  // buildPayload serialises the ParsedConversation into a plain-text string
  // see buildPayload below for what is included and excluded
  const payload = buildPayload(parsedConversation);

  // STEP 2: SYSTEM PROMPT
  // tells Claude what it is doing and what kind of output to produce
  // output should be optimised for Claude/Claude Code to consume, not human prose
  const systemPrompt = "You are generating a structured continuation prompt for a developer picking up from a previous Claude Code session. The output should be optimised for Claude/Claude Code to consume, not human prose";

  // STEP 3: CREATE CLIENT
  // dangerouslyAllowBrowser is required because this runs inside Tauri's webview, not a server
  // the key is read from .env (dev) - will move to OS keychain in Phase 5
  const client = new Anthropic({
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
    dangerouslyAllowBrowser: true
  });

  // STEP 4: CALL API + EXTRACT RESPONSE
  // no streaming - we wait for the full response before displaying anything
  // max_tokens: 4096 is sufficient for a continuation prompt
  // response.content is an array of blocks - we expect exactly one text block
  try {
    const response = await client.messages.create({
      max_tokens: 4096,
      messages: [{ role: "user", content: payload }],
      model: model,
      system: systemPrompt
    })

    const block = response.content[0];

    if (block.type === "text") {
      return block.text;
    }
  } catch (error) {
    // re-throw with user-readable messages so OutputPanel can display them
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



// buildPayload
// serialises a ParsedConversation into a plain-text string to send as the user message
//
// INCLUDE: session metadata, user message text, assistant message text, tool call type + path/command
// EXCLUDE: thinking block content (internal reasoning), tool result content (too noisy), sessionId (not useful for continuation)
function buildPayload(conversation: ParsedConversation): string {
    const messagesText = conversation.messages.map((message) => {
      // CASE A: user message - include text only
      if (message.role === "user") {
        return `
        Role: ${message.role}
        Text: ${message.text}
        `
      // CASE B: assistant message - include text + tool call type and path/command
      // tool result content is excluded - full stdout can be thousands of lines and adds noise
      } else {
        return `
        Role: ${message.role}
        Text: ${message.text}
        Tool calls: ${message.toolCalls.map((toolCall) => {
          if (toolCall.type === "bash") {
            return `bash: ${toolCall.command}`;

          } else if (toolCall.type === "glob") {
            return `glob: ${toolCall.pattern}`;

          } else if (toolCall.type === "read") {
            return `read: ${toolCall.filePath}`;

          } else if (toolCall.type === "write") {
            return `write: ${toolCall.filePath}`;

          } else if (toolCall.type === "edit") {
            return `edit: ${toolCall.filePath} (diff: ${toolCall.diff})`;
          }
        })
        .join(", ")
      }
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
