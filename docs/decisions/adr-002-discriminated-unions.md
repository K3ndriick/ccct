# ADR-002: Discriminated Unions for ToolCall and Message Types

---

## Context

CCCT renders two fundamentally variable things: tool calls and messages.

Tool calls come in five varieties - Read, Edit, Bash, Glob, Write - and each carries different data. A Read call has a `filePath`. A Bash call has a `command`. An Edit call has a `filePath`, an `oldString`, and a `newString`. There is no single set of fields that applies to all of them.

Messages are either from the user or the assistant, and they have completely different shapes. A user message is just text. An assistant message has optional text, an array of thinking blocks, and an array of tool calls.

The naive approach is a single flat type with optional fields:

```ts
type ToolCall = {
  type: string
  filePath?: string
  command?: string
  pattern?: string
  oldString?: string
  newString?: string
  result: ToolResult
}
```

This compiles, but TypeScript has no way to know which fields are valid for which `type` value. Every access to `toolCall.filePath` requires a manual runtime check, and the compiler cannot catch mistakes like accessing `toolCall.command` on a Read tool call.

---

## Decision

Discriminated unions on a shared literal field (`type` for tool calls, `role` for messages).

```ts
type ToolCall =
  | ToolCallBase & { type: 'read';  filePath: string }
  | ToolCallBase & { type: 'edit';  filePath: string; oldString: string; newString: string }
  | ToolCallBase & { type: 'bash';  command: string }
  | ToolCallBase & { type: 'glob';  pattern: string }
  | ToolCallBase & { type: 'write'; filePath: string }

type Message =
  | { role: 'user';      text: string }
  | { role: 'assistant'; text?: string; thinkingBlocks: ThinkingBlock[]; toolCalls: ToolCall[] }
```

`ToolCallBase` (not exported) is `{ result: ToolResult }` - intersected into each variant so the result field is not repeated five times.

When a component switches on `toolCall.type`, TypeScript narrows the type to the matching variant. Inside a `case 'bash'` branch, `toolCall.command` is typed as `string` - not `string | undefined`. Accessing `toolCall.filePath` in that same branch is a compile error. The compiler enforces correct field access per variant without any runtime checks.

---

## Why This Over the Alternatives

The practical payoff is in the rendering layer. `ToolCallCard` needs to display the right content for each tool type. With a flat optional-field type, every field access needs a runtime guard and there is nothing stopping a future change from introducing a case that was not handled. With discriminated unions, an unhandled variant is a TypeScript error - the compiler flags it before the code runs.

The same applies to `Message`. A component that only renders user messages can accept `{ role: 'user'; text: string }` rather than the full union - TypeScript enforces that only user messages are passed in.

The tradeoff is that adding a new tool type requires updating the union and every switch statement that handles it. For this project that is the right tradeoff: exhaustiveness is a feature, not a burden. A new tool type that is silently ignored would produce a broken UI.

---

## Consequences

The pattern held up cleanly throughout development. The `ContentBlock` type in the raw parser layer uses the same approach for the Anthropic API's content block variants (`text`, `thinking`, `tool_use`, `tool_result`), which kept the parser consistent with the rest of the type system.

The same pattern would be the default choice for any similar domain - wherever a value's shape depends on a known set of variants, a discriminated union is preferable to optional fields.
