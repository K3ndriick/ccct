# CCCT Design Document
## Claude Code Context Transfer - Visual & UX Guidelines

---

## Design Philosophy

CCCT is a developer tool, not a consumer app. The design should feel like something a developer built for developers - intentional, minimal, and fast. Every visual decision should serve one of three goals: **clarity** (what am I looking at?), **hierarchy** (what matters most?), or **action** (what can I do?).

We are not cloning Claude's brand. We are building in the same genre - a tool for people who use Claude Code - but with our own visual identity. The result should feel like it belongs next to VSCode and Linear, not like a fan-made Anthropic product.

---

## Color System

### Base Palette

CCCT uses a **warm dark theme**. Surfaces are not pure black or grey - they carry a very subtle warm tint that makes the app feel distinct from cold terminal tools like CCHV.

| Token             | Hex       | Usage                                     |
|-------------------|-----------|-------------------------------------------|
| `surface-base`    | `#0f0e0d` | App background, deepest layer             |
| `surface-raised`  | `#1a1917` | Sidebar, panels                           |
| `surface-overlay` | `#252320` | Cards, conversation bubbles, hover states |
| `surface-border`  | `#2e2c29` | Dividers, borders, input outlines         |
| `text-primary`    | `#f0ede8` | Main readable text                        |
| `text-secondary`  | `#9c9790` | Labels, metadata, timestamps              |
| `text-muted`      | `#5c5a56` | Placeholder text, disabled states         |

### Accent - Electric Green

The single accent color. Used for primary actions, active states, focus rings, and highlights. A bright, distinctive green that sits between pure green and teal - electric without being a generic terminal or success color. Chosen specifically because it's not a shade anyone picks by accident.

| Token           | Hex       | Usage                                              |
|-----------------|-----------|----------------------------------------------------|
| `accent`        | `#06d472` | Primary buttons, active sidebar items, focus rings |
| `accent-dim`    | `#059950` | Hover states on accent elements                    |
| `accent-subtle` | `#041f0e` | Accent backgrounds, subtle highlights              |

**Backup accent - Teal** (swap if green isn't working)

If `#06d472` feels too electric in practice, the backup is teal. Tonally compatible - same energy, slightly more subdued. One-line swap in CSS tokens.

| Token           | Hex       |
|-----------------|-----------|
| `accent`        | `#2dd4bf` |
| `accent-dim`    | `#0f9488` |
| `accent-subtle` | `#041412` |

### Status / Indicator Colors

Used only for semantic meaning - never decorative.

| Token            | Hex       | Usage                                           |
|------------------|-----------|-------------------------------------------------|
| `status-success` | `#22c55e` | Tool result success, ✅ indicators              |
| `status-error`   | `#ef4444` | Tool result errors, ❌ indicators, error states |
| `status-warning` | `#eab308` | Warnings, pending states                        |
| `status-info`    | `#3b82f6` | Neutral info, Read tool indicators              |

### Tool Call Icon Colors

Each tool type gets a consistent color used in its icon/badge only.

| Tool     | Color      | Hex       |
|----------|------------|-----------|
| Read     | Blue       | `#3b82f6` |
| Write    | Green      | `#22c55e` |
| Edit     | Yellow     | `#eab308` |
| Bash     | Orange     | `#f97316` |
| Glob     | Grey       | `#6b7280` |
| Thinking | Accent dim | `#059950` |

---

## Typography

One font family throughout. **Inter** (system fallback: `-apple-system, BlinkMacSystemFont, sans-serif`).

| Role                | Size | Weight        | Color            |
|---------------------|------|---------------|------------------|
| App title           | 13px | 600           | `text-primary`   |
| Section header      | 11px | 600 uppercase | `text-muted`     |
| Body / message text | 14px | 400           | `text-primary`   |
| Code (inline)       | 13px | 400           | `text-primary`   |
| Code (block)        | 13px | 400           | `text-primary`   |
| Label / metadata    | 12px | 400           | `text-secondary` |
| Timestamp           | 11px | 400           | `text-muted`     |

Code blocks use **JetBrains Mono** (fallback: `Consolas, monospace`).

---

## Layout & Spacing

### App Shell

Three-column layout (fixed sidebar, conversation pane, output panel):

```
┌──────────────────────────────────────────────────────────┐
│ CCCT                                          [⚙ Settings]│
├────────────┬────────────────────────────┬────────────────┤
│  Sidebar   │   Conversation View        │  Output Panel  │
│  240px     │   flex-1                   │  320px         │
│            │                            │                │
│            │                            │                │
└────────────┴────────────────────────────┴────────────────┘
```

The output panel (where the generated continuation prompt lives) collapses when no prompt has been generated yet, expanding the conversation view.

### Spacing Scale

Use multiples of 4px. Common values:

| Token | Value | Usage                                   |
|-------|-------|-----------------------------------------|
| `xs`  | 4px   | Icon gaps, tight inline spacing         |
| `sm`  | 8px   | Component internal padding              |
| `md`  | 12px  | Standard padding, gaps between elements |
| `lg`  | 16px  | Section padding                         |
| `xl`  | 24px  | Major section gaps                      |

### Visual Density

**Sidebar**: Compact. Conversation items show slug + date only. 36px row height.

**Conversation view**: Breathable. Messages have generous vertical spacing (16px between messages). Tool call cards are collapsed by default - they take minimal height until expanded.

**Output panel**: Spacious. The generated prompt is the hero - give it room to breathe with 20px padding.

---

## Components

### Sidebar

- Background: `surface-raised`
- Project group headers: 11px uppercase, `text-muted`, not interactive
- Conversation items: 36px height, 12px horizontal padding
- Active item: `accent-subtle` background, `accent` left border (2px), `text-primary` label
- Inactive item: transparent background, `text-secondary` label
- Hover: `surface-overlay` background

### Message Bubbles

**User messages**
- Background: `surface-overlay`
- Border: 1px `surface-border`
- Border radius: 8px
- Padding: 12px 16px
- Label: "You" in `text-muted`, 11px

**Assistant messages**
- Background: transparent (no bubble)
- Left border: 2px solid `surface-border`
- Padding left: 16px
- Label: "Claude" in `text-muted`, 11px

### Tool Call Cards

Collapsed state shows: icon + tool name + file path/command (truncated). 32px height.

Expanded state shows: full input content in a code block.

- Background: `surface-raised`
- Border: 1px `surface-border`
- Border radius: 6px
- Icon: color-coded per tool type (see Tool Call Icon Colors)
- Chevron indicator for expand/collapse

### Thinking Blocks

- Background: `accent-subtle`
- Border left: 2px solid `accent-dim`
- Label: "Thinking" in `accent-dim`
- Collapsed by default
- Italic text style to visually distinguish from normal responses

### Diff View

- Added lines: `#1a2e1a` background, `#22c55e` text, `+` prefix
- Removed lines: `#2e1a1a` background, `#ef4444` text, `-` prefix
- Context lines: `surface-raised` background, `text-muted` text
- Monospace font, 13px

### Generate Prompt Button

This is the primary CTA - it should stand out clearly.

- Background: `accent` (`#06d472`)
- Text: `#0f0e0d` (dark on green - high contrast)
- Font: 14px, weight 600
- Padding: 10px 20px
- Border radius: 6px
- Hover: `accent-dim` background
- Full width within the output panel header

### Output Panel (Generated Prompt)

- Background: `surface-raised`
- Monospace font for the prompt content
- Copy button in top-right corner of the prompt block
- Subtle `surface-border` separator between metadata and prompt text

---

## Iconography

Use **Lucide** icons throughout (already a common React icon library, lightweight, consistent stroke weight).

| Element             | Icon                           |
|---------------------|--------------------------------|
| Settings            | `Settings`                     |
| Re-index            | `RefreshCw`                    |
| Read tool           | `FileText`                     |
| Write tool          | `FilePlus`                     |
| Edit tool           | `FileEdit`                     |
| Bash tool           | `Terminal`                     |
| Glob tool           | `Search`                       |
| Thinking            | `Brain`                        |
| Tool result success | `CheckCircle`                  |
| Tool result error   | `XCircle`                      |
| Copy                | `Copy`                         |
| Expand/collapse     | `ChevronDown` / `ChevronRight` |
| Generate prompt     | `Sparkles`                     |

---

## Motion & Interaction

Keep it minimal. This is a tool, not a showcase.

- **Collapsible sections**: 150ms ease-out height transition
- **Hover states**: instant (no transition)
- **Sidebar active state**: instant
- **Generate button loading**: spinner replaces icon, no layout shift
- **Copy confirmation**: icon swaps to `Check` for 1500ms then reverts

No page transitions, no entrance animations, no decorative motion.

---

## What We Are Not Doing

- No light mode in v1
- No theme toggle in v1
- No gradients
- No shadows (use borders instead for separation)
- No blur effects
- No Claude logo or Anthropic branding
- No rounded corners larger than 8px
- No colored backgrounds on message bubbles (except user messages)
