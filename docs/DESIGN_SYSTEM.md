# CCCT Design System - Warm Graphite

## Claude Code Context Transfer · Visual & UX Guidelines (current)

> Supersedes `docs/v1/DESIGN.md` (Warm-Dark / Electric-Green). The v1 doc stays as history.
> Palette locked from the [cool-graphite mockup](https://claude.ai/code/artifact/b4217026-05da-4348-a80c-306eeb2a8448).
> Layout/UX + light mode + loading states locked from the [redesign prototype](https://claude.ai/code/artifact/c9d9cecf-357b-4ed5-91e7-4baed5e6384a).
>
> **Confirmed scope:** the palette below · four structural features (session summary header, long-session navigation, continuation workflow, ⌘K palette) · light/dark theming · skeleton + empty states.

---

## Design Philosophy

CCCT is a developer tool, not a consumer app. It should feel like something a developer built for developers - intentional, minimal, fast. Every visual decision serves **clarity** (what am I looking at?), **hierarchy** (what matters most?), or **action** (what can I do?).

**What changed from v1.** We kept the "warm, not cold" instinct but moved off the electric-green identity. The ground is now a **neutral graphite ramp, warmed a touch** (R ≥ G ≥ B), so hierarchy is carried by *shades of grey* rather than color. Green survives as a **rationed accent** - it appears in ~3 places, never as chrome. Result belongs next to Linear, Supabase, and Obsidian: a quiet instrument that gets out of the content's way.

Two deliberate relaxations from v1: we now allow **one soft shadow** on genuinely floating elements, and **tasteful GSAP entrance motion** on the message stream. Both are rationed the same way green is.

---

## Color System

### Graphite Ramp (the workhorse)

Neutral with a slight warm lean. Hierarchy comes from stepping through this ramp, not from hue.

| Token   | Hex       | Role                                             |
|---------|-----------|--------------------------------------------------|
| `g-000` | `#0b0a0a` | Page void (behind the app window / deepest well) |
| `g-050` | `#100f0f` | **App base** - conversation background           |
| `g-100` | `#161514` | **Raised** - sidebar, output panel               |
| `g-150` | `#1b1a18` | **Header bars** - titlebar, conversation header  |
| `g-200` | `#211f1d` | **Cards** - user bubbles, tool cards, inline code |
| `g-250` | `#282623` | Hover / selected surface                         |
| `g-300` | `#2f2d29` | Borders (strong), chip outlines                  |
| `g-350` | `#393632` | Hairline emphasis, traffic dots                  |
| `line`  | `#22201d` | **Default hairline** - dividers, quiet borders   |

### Text

| Token      | Hex       | Usage                                      |
|------------|-----------|--------------------------------------------|
| `text`     | `#ece9e5` | Primary readable text                      |
| `text-2`   | `#a6a199` | Labels, metadata, secondary body           |
| `text-3`   | `#706b63` | Muted - captions, inactive, tool args      |
| `text-4`   | `#504b44` | Faint - placeholders, disabled, sublabels  |

### Accent - Green (rationed)

The single accent. **Do not use it as chrome.** It marks state and the one loud action.

| Token        | Value                       | Usage                                    |
|--------------|-----------------------------|------------------------------------------|
| `acc`        | `#22c98a`                   | Generate button, selected marker, live dot |
| `acc-dim`    | `#17a06d`                   | Accent hover / pressed                   |
| `acc-soft`   | `rgba(34,201,138,0.12)`     | Accent glow / focus ring fill            |
| `acc-line`   | `rgba(34,201,138,0.28)`     | Accent hairline (focus, active border)   |
| `on-acc`     | `#06231a`                   | Text/icon on the green button (dark)     |

**The green budget - allowed uses only:**
1. Titlebar "API connected" live dot
2. Selected conversation left-marker (2.5px bar) in the sidebar
3. "Generate prompt" primary button (the single filled CTA)
4. (micro) the `✓` success glyph in tool output; focus rings

If you find green anywhere else, it's a bug in the design, not a feature.

### Semantic Status

Meaning only, never decoration. Kept distinct from the accent.

| Token            | Hex       | Usage                              |
|------------------|-----------|------------------------------------|
| `status-success` | `#22c98a` | Success glyphs (shares accent hue) |
| `status-error`   | `#ef5350` | Errors, failed tool results        |
| `status-warning` | `#e0b23a` | Warnings, pending                  |
| `status-info`    | `#5391f0` | Neutral info                       |

### Tool Colors (semantic, restored)

Each tool type gets one consistent hue, used **only** in its icon chip: 15% color mixed into the card surface, colored glyph, 32%-opacity colored border. Legible at a glance, quiet against graphite, clearly not the accent.

| Tool           | Hex       | Glyph |
|----------------|-----------|-------|
| Read           | `#5391f0` | `R`   |
| Bash           | `#f5883c` | `$`   |
| Edit           | `#e0b23a` | `E`   |
| Write          | `#3cc07d` | `W`   |
| Glob / Grep    | `#8a8681` | `*`   |

Chip recipe (CSS): `background: color-mix(in srgb, <tool> 15%, var(--g-100)); color: <tool>; border-color: color-mix(in srgb, <tool> 32%, transparent);`

**Thinking blocks changed:** the thinking chip is now **grey** (`text-3` on `g-150`), not accent-tinted - it reads as metadata, not a call to action. The v1 purple `#a855f7` is retired.

### Light Theme (warm paper)

The app ships an in-product light/dark toggle. Light is a **warm paper** ground with the same warm bias as dark - the same design system inverted, not a different one. Design both with equal care; do **not** naively invert. Values below are the light overrides for the same token names (the dark values above are the defaults).

| Token   | Dark      | Light     | Light role                              |
|---------|-----------|-----------|-----------------------------------------|
| `g-000` | `#0b0a0a` | `#e7e3db` | Page void / backdrop                    |
| `g-050` | `#100f0f` | `#f7f5f1` | App base - conversation (warm paper)    |
| `g-100` | `#161514` | `#efece6` | Raised - sidebar, right panel           |
| `g-150` | `#1b1a18` | `#eae7e0` | Header bars                             |
| `g-200` | `#211f1d` | `#ffffff` | Cards - lift off the paper with a hairline |
| `g-250` | `#282623` | `#e9e5dd` | Hover / selected                        |
| `g-300` | `#2f2d29` | `#e0dbd2` | Borders (strong)                        |
| `g-350` | `#393632` | `#d0cabf` | Hairline emphasis                       |
| `line`  | `#22201d` | `#e6e2da` | Default hairline                        |
| `text`  | `#ece9e5` | `#2a2724` | Primary (warm near-black)               |
| `text-2`| `#a6a199` | `#5f5a52` | Secondary                               |
| `text-3`| `#706b63` | `#8a847a` | Muted                                   |
| `text-4`| `#504b44` | `#aca69b` | Faint                                   |

**Light gets its own tuned accent + tool colors** - the bright dark values fail contrast on white:

| Token        | Dark                    | Light                     |
|--------------|-------------------------|---------------------------|
| `acc`        | `#22c98a`               | `#0c8f57`                 |
| `acc-dim`    | `#17a06d`               | `#0a7548`                 |
| `acc-soft`   | `rgba(34,201,138,.12)`  | `rgba(12,143,87,.13)`     |
| `acc-line`   | `rgba(34,201,138,.28)`  | `rgba(12,143,87,.34)`     |
| `on-acc`     | `#06231a`               | `#ffffff`                 |
| `tool-read`  | `#5391f0`               | `#2f6fd0`                 |
| `tool-bash`  | `#f5883c`               | `#cf6a20`                 |
| `tool-edit`  | `#e0b23a`               | `#a07714`                 |
| `tool-write` | `#3cc07d`               | `#12915a`                 |

Green stays rationed to the same budget in both themes. Light-mode floating shadow softens/warms: `0 30px 70px -46px rgba(60,50,40,.55)`.

---

## Typography

Two families, unchanged from v1. **Inter** for UI/prose, **JetBrains Mono** for code, file paths, metadata, and data.

| Role                | Size   | Weight | Color    |
|---------------------|--------|--------|----------|
| App / panel title   | 13–14px | 640   | `text`   |
| Conversation title  | 14.5px | 640    | `text`   |
| Section header      | 11px   | 600 uppercase, `0.14em` | `text-3` |
| Body / message text | 13.5px | 400    | `text`   |
| Code (inline)       | 12px   | 400 mono, on `g-200` | `text` |
| Code (block)        | 13px   | 400 mono | `text` |
| Label / metadata    | 11–12px | 400/500 mono | `text-3` |
| Timestamp / count   | 10.5px | 400 mono, `tabular-nums` | `text-4` |

Rules: running prose stays near 65ch (`max-width: 720px` centered stream). Titles get `letter-spacing: -0.01em`. Uppercase labels get `0.12–0.14em` tracking. Digits that line up (msg counts, durations) use `font-variant-numeric: tabular-nums`.

---

## Layout & Spacing

### App Shell - three panes

```
┌────────────────────────────────────────────────────────────────────┐
│ ● ● ●   ccct - conversation history   [🔍 ⌘K] [◐]   ● API connected │  titlebar (g-150)
├──────────────┬─────────────────────────────────┬───────────────────┤
│  Sidebar     │  Summary header (title·meta·gist │  Right panel      │
│  248px       │   ·files-touched chips)          │  344px (g-100)    │
│  (g-100)     ├─────────────────────────────────┤  ┌─────┬────────┐ │
│  search→⌘K   │  Filter bar: Thinking·Tools·User │  │Cont.│Outline │ │  tabs
│              ├─────────────────────────────────┤  └─────┴────────┘ │
│  projects →  │  Stream  flex-1 (g-050)          │  Continuation:    │
│  conversations│  max-w 720px, turn stagger      │   captured ctx,   │
│              │                                  │   token count,    │
│              │                                  │   editable prompt │
│              │                                  │  Outline: jump-   │
│              │                                  │   list of turns   │
└──────────────┴─────────────────────────────────┴───────────────────┘
```

**Redesign changes vs. today:**
- The thin metadata strip becomes a **session summary header** (title · model · msgs · tokens · duration · one-line gist · files-touched chips).
- A **filter bar** under it toggles visibility of thinking / tool calls / assistant turns, acting live on the stream.
- The old output panel becomes a **tabbed right panel**: *Continuation* (captured-context list, token count, editable prompt, Copy + Regenerate) and *Outline* (numbered jump-list of user turns; click to scroll). Tabs chosen over a 4th column to keep 344px uncramped - trade-off is you see one at a time.
- **⌘K command palette** overlays the whole app for global search + actions.

Right panel collapses when no conversation is selected. Sidebar and right panel stay resizable (drag handles kept; hover tint moves from `accent` to `acc-line`). Responsive fallbacks: hide right panel < 1120px, hide sidebar < 760px, so the page never scrolls sideways.

### Spacing Scale - multiples of 4px

| Token | Value | Usage                         |
|-------|-------|-------------------------------|
| `xs`  | 4px   | Icon gaps, tight inline       |
| `sm`  | 8px   | Component internal padding    |
| `md`  | 12px  | Standard padding / gaps       |
| `lg`  | 16px  | Section padding               |
| `xl`  | 20–24px | Stream gaps, major sections |

### Radii

| Token       | Value  | Usage                          |
|-------------|--------|--------------------------------|
| `r-chip`    | 6px    | Tool glyph chips, kbd, badges  |
| `r-control` | 8–9px  | Inputs, buttons, selects       |
| `r-card`    | 10–12px | Tool cards, prompt card, bubbles |
| `r-window`  | 16px   | App window frame               |
| `r-pill`    | 999px  | Thinking chip, status pills    |

(Relaxed from v1's "nothing > 8px" - cards go to 12px, window to 16px.)

### Elevation

Borders do the separating; **shadow is reserved for genuinely floating elements** - the app window in a product shot, hover-lifted cards, and floating scroll buttons.

- Hairline: `1px solid var(--line)`
- Floating: `box-shadow: 0 22px 50px -28px rgba(0,0,0,0.7)`
- No blur, no gradients as chrome (a faint radial vignette behind the window is fine).

---

## Components

### Sidebar (`g-100`)
- Section header: 11px uppercase `text-3`.
- Search: `g-050` field, `g-300` border, `⌘K` kbd hint in `text-4`.
- Project group header: mono path `text-2`, right-aligned count in `text-4`, chevron `text-4`.
- Conversation item: title `text-2`/500, meta `text-4` mono. Hover → `g-150`.
- **Active item:** `g-250` background, `text` title, **2.5px `acc` left-marker**, no fill tint.

### Session Summary Header (`g-150`)
Replaces the thin metadata strip. Two rows + chips:
- **Top row:** title (15px/640) + right-aligned mono meta (`model · N msgs · ~tokens · duration`) in `text-3`, `·` separators in `text-4`.
- **Gist:** one-line auto-summary of the session, `text-2`, `max-width: 70ch`.
- **Files-touched chips:** mono, `g-100` on `g-300`, each with a 6px square dot colored by dominant tool (Edit amber / Write green).

### Filter Bar (`g-050`)
- Uppercase `Show` label in `text-4`, then toggle **pills**: Thinking, Tool calls, User turns only.
- Pill off: `g-150` on `g-300`, `text-2`, empty check box. Pill on: `acc-soft` fill, `acc-line` border, `text`, filled `acc` check box.
- Acts live on the stream (`hide-think` / `hide-tools` / `user-only` classes). Right-aligned turn count in `text-4`, `tabular-nums`.

### Message - User (`g-200`)
- Right-aligned, `max-width: 78%`, `1px g-300` border, radius `13px 13px 4px 13px`.
- "You" label in `text-4`, 10.5px. Body 13.5px `text`.

### Message - Assistant
- No bubble. `2px line` left rail, 16px left padding.
- Label: 18px `g-300` mono "C" mark + "Claude" in `text-3`.
- Markdown body 13.5px/1.62. Inline `code` on `g-200` with `g-300` border.

### Thinking Chip
- Pill, `g-150` on `g-300` border, `text-3` label, `text-4` spark + chevron. **Grey, collapsed by default.**

### Tool Call Card (`g-100`)
- Collapsed: colored tool chip + name (`text`, 600) + arg (mono `text-3`, truncated) + chevron `text-4`.
- Expanded output: `g-050` panel, mono 11px `text-3`, `overflow-x: auto`, `✓` in `acc`.

### Right Panel - tabs (`g-100`)
Segmented tabs on a `g-150` bar: **Continuation** (default) and **Outline** (with a turn-count badge). Active tab is `g-100` with a `line` border; the pane below scrolls.

**Continuation tab**
- Header: "Continuation Prompt" + right-aligned mono token pill (`~1.2k tok`) on `g-050`.
- **Captured-context card:** `g-050` on `g-300`; small uppercase label; list of what was captured (files, decisions, test status) with `text-4` leading icons and inline `code`.
- Model select: `g-050` field, mono value.
- **Editable prompt:** `textarea` on `g-050`, `text-2`, focus ring = `acc-soft` fill + `acc-line` border.
- Actions: **Copy** (filled `acc`, `on-acc`, `Sparkles`/`Copy` icon; → "Copied ✓" 1400ms) + **Regenerate** (ghost: `g-200` on `g-300`, `text-2`).

**Outline tab**
- Uppercase "User turns · click to jump" label.
- Each item: mono index (`text-4`, `tabular-nums`) + turn title (`text-2`, truncated, → `text` on hover) + sub-line tool count (`text-4`). Hover `g-150`.
- Click → smooth-scroll the turn into view + a 1.1s `acc-soft` flash. (This is also the selection surface if/when "select turns to include" ships - see roadmap.)

### Command Palette - ⌘K (`g-100`, floating)
Full-app overlay: `rgba(6,5,5,.55)` scrim, centered box `min(560px, 88%)`, `g-350` border, floating shadow, offset ~80px from top.
- Input row: `Search` icon (`text-4`) + 14px input + `Esc` kbd hint; `line` divider.
- Grouped results (`Conversations`, `Actions`), uppercase group labels in `text-4`. Item = leading icon (`text-3`) + title (`text`) + right-aligned mono context/shortcut (`text-4`). Selected/hover row `g-200`.
- Empty: centered "No matches." in `text-4`.
- Opens via ⌘K / Ctrl+K or the titlebar search button; Esc / scrim-click closes. Built on shadcn `command` + `dialog`.

### Skeleton & Empty States
- **Skeleton (loading):** shown while a JSONL parses, shaped like the real stream (a `sk-user` bar, `sk-line`s, `sk-card`s) at `max-width: 720px`. Shimmer = 400%-wide gradient `g-150 → g-250 → g-150`, `background-position` sweep 1.4s linear; disabled under reduced-motion. Adapts to theme via tokens.
- **Empty (no selection):** centered `MessageSquare` icon (`text-4`), "No conversation selected" (`text-2`, 600), one guidance line (`text-4`, `max-width: 36ch`), and a "Press ⌘K to search" mono hint.
- (Existing) **Error state:** `AlertTriangle` in `status-error` + message.

### Theme Toggle
Titlebar icon button (`ttoggle`: `g-100` on `g-300`, 30×26, `text-3` → `text-2` on hover). Sun icon in dark (→ switch to light), Moon in light. Flips the whole app by swapping the token set (see Light Theme). Persist the choice to settings.

### Diff View
- Added: `#14251b` bg, `status-success` text, `+`.
- Removed: `#2a1717` bg, `status-error` text, `-`.
- Context: `g-100` bg, `text-3`. Mono 13px.

---

## Iconography

**Lucide**, consistent stroke. Same mapping as v1 (Settings, RefreshCw, FileText/FilePlus/FileEdit, Terminal, Search, CheckCircle/XCircle, Copy, ChevronDown/Right, Sparkles). **Thinking** icon drops the brand-purple treatment - render in `text-3`.

---

## Motion & Interaction

Rationed like the accent. Powered by **GSAP** in the app (the mockup used WAAPI as a sandbox stand-in). Everything below must respect `prefers-reduced-motion: reduce` - disable transforms/opacity tweens, keep instant state.

| Moment                    | Spec                                                                 |
|---------------------------|----------------------------------------------------------------------|
| Message stream on load    | Staggered rise: `opacity 0→1`, `y 10→0`, 480ms, 90ms stagger, `cubic-bezier(.2,.7,.2,1)`. Fires once per conversation open, not on scroll. |
| Card / panel hover lift   | `translateY(-2px)` + border → `acc-line`, 300ms.                     |
| Collapsible (tool/thinking)| Height + opacity, 200ms ease-out.                                   |
| Generate loading          | Icon → spinner in place, no layout shift; optional subtle shimmer on the prompt card while streaming. |
| Copy confirmation         | Label swap to "Copied ✓" (`acc`) for 1400ms, then revert.           |
| Outline jump              | Smooth-scroll turn into view + 1.1s `acc-soft` background flash.      |
| Skeleton shimmer          | Gradient sweep 1.4s linear infinite while loading; off under reduced-motion. |
| Theme toggle              | Instant token swap (no cross-fade - avoids a flash of half-themed UI).|
| Sidebar active            | Instant (state, not animation).                                      |

No page transitions, no decorative loops, no parallax. If a motion doesn't clarify a state change, cut it.

---

## Implementation Mapping → `tailwind.config.js`

Drop-in replacement for the `colors` block. Keeps the existing semantic names the components already reference (`surface-*`, `text-*`, `accent*`, `status-*`, `tool-*`) so the refactor is a value swap, plus a raw `graphite` scale for new work.

```js
colors: {
  // raw ramp
  graphite: {
    0:  '#0b0a0a', 50: '#100f0f', 100: '#161514', 150: '#1b1a18',
    200: '#211f1d', 250: '#282623', 300: '#2f2d29', 350: '#393632',
  },
  // semantic surfaces (existing names, new values)
  'surface-base':          '#100f0f',  // g-050
  'surface-raised':        '#161514',  // g-100
  'surface-header':        '#1b1a18',  // g-150  (new)
  'surface-overlay':       '#211f1d',  // g-200
  'surface-hover':         '#282623',  // g-250  (new)
  'surface-border':        '#22201d',  // line
  'surface-border-strong': '#2f2d29',  // g-300  (new)
  // text
  'text-primary':   '#ece9e5',
  'text-secondary': '#a6a199',
  'text-muted':     '#706b63',
  'text-faint':     '#504b44',  // (new; was folded into muted)
  // accent - rationed green
  'accent':        '#22c98a',
  'accent-dim':    '#17a06d',
  'accent-subtle': 'rgba(34,201,138,0.12)',
  'on-accent':     '#06231a',
  // status
  'status-success': '#22c98a',
  'status-error':   '#ef5350',
  'status-warning': '#e0b23a',
  'status-info':    '#5391f0',
  // tools
  'tool-read':  '#5391f0',
  'tool-bash':  '#f5883c',
  'tool-edit':  '#e0b23a',
  'tool-write': '#3cc07d',
  'tool-glob':  '#8a8681',
},
```

> Note: `accent-subtle` moves from a solid hex to an rgba glow. Audit its current uses (backgrounds vs. borders) during the refactor.

### Theming for light/dark (shadcn-compatible)

Because we now ship a toggle, drive colors through **CSS variables** rather than hardcoded Tailwind hex, so shadcn primitives and our own components theme from one source. Define the dark set on `:root`, override under `[data-theme="light"]`, and point Tailwind at the vars.

```css
:root {                    /* dark (default) */
  --g-050:#100f0f; --g-100:#161514; --g-150:#1b1a18; --g-200:#211f1d;
  --g-250:#282623; --g-300:#2f2d29; --g-350:#393632; --line:#22201d;
  --text:#ece9e5; --text-2:#a6a199; --text-3:#706b63; --text-4:#504b44;
  --acc:#22c98a; --on-acc:#06231a;
  --tool-read:#5391f0; --tool-bash:#f5883c; --tool-edit:#e0b23a; --tool-write:#3cc07d;
}
[data-theme="light"] {     /* warm paper */
  --g-050:#f7f5f1; --g-100:#efece6; --g-150:#eae7e0; --g-200:#ffffff;
  --g-250:#e9e5dd; --g-300:#e0dbd2; --g-350:#d0cabf; --line:#e6e2da;
  --text:#2a2724; --text-2:#5f5a52; --text-3:#8a847a; --text-4:#aca69b;
  --acc:#0c8f57; --on-acc:#ffffff;
  --tool-read:#2f6fd0; --tool-bash:#cf6a20; --tool-edit:#a07714; --tool-write:#12915a;
}
```

Then in `tailwind.config.js` reference them (`'surface-base': 'var(--g-050)'`, `'accent': 'var(--acc)'`, …) and map shadcn's `--background/--foreground/--primary/--border/...` onto the same variables. `data-theme` is set on `<html>` from persisted settings.

---

## Rollout Plan

Confirmed scope = **reskin + redesign + light/dark + loading states**. Order (each step is a reviewable checkpoint):

1. **Tokens + theming** - introduce the CSS variables (dark + light), point `tailwind.config.js` at them, add the `graphite` scale. Wire `data-theme` on `<html>`. Verify build; no visual regressions yet.
2. **shadcn setup** - `init` (`components.json`, `cn()` util, `@/` alias); map shadcn vars onto our tokens. Add only `command`, `dialog`, `select`, `tooltip`.
3. **Reskin pass** (existing components, value-swap first): `ConversationView` stream → `UserMessage` / `AssistantMessage` → `ThinkingBlock` (grey) → `ToolCallCard` (semantic chips) → `Sidebar` (marker) → `TopBar` (live dot + theme toggle).
4. **Structural features:**
   - a. **Session summary header** (+ files-touched - derive from tool calls in the parse).
   - b. **Filter bar** (thinking / tools / user-only) acting on the stream.
   - c. **Right panel tabs** - Continuation workflow (captured context, token count, editable prompt, Copy/Regenerate) + Outline (jump-list).
   - d. **⌘K command palette** (shadcn `command`) - global search across the index + actions.
5. **States** - skeleton loader for the stream while parsing; real empty state; keep the error state.
6. **Light/dark toggle** - persist to settings; verify both themes across every component (contrast, green budget).
7. **Motion** - GSAP: stream stagger, hover lift, collapsibles, outline flash; reduced-motion guard throughout.
8. **Verify** - run against a real session; confirm the green budget holds and both themes read correctly.

## Roadmap (not in this scope, parked)

- **"Select turns to include"** in the continuation prompt - subtractive/rule-based selection (smart default + quick-select rules + token budget), *not* manual per-turn ticking. Outline is the selection surface.
- Sidebar facets, snippet search results, scrollbar minimap markers, "files touched" cross-reference, "Open in Claude Code", project dashboard.

## What We Are Still Not Doing

- No gradients or blur as chrome.
- No green outside its sanctioned budget.
- No decorative motion, no page transitions.
- No Claude logo or Anthropic branding.
