> **Superseded** by [docs/decisions/why-we-didnt-build-v2.md](../decisions/why-we-didnt-build-v2.md). Preserved as historical record of the original v2 plan.

# CCCT v2 Design Document
## Visual & UX Guidelines - v2 Additions

**Inherits**: All color tokens, typography, spacing, and component patterns from v1 DESIGN.md.  
This document covers only what is new or changed in v2. Read v1 DESIGN.md first.

---

## What Carries Over Unchanged

- Warm dark color system (`surface-*`, `text-*`, `accent`, `status-*`)
- Typography (Inter + JetBrains Mono, same size/weight scale)
- Spacing scale (4px base, `xs/sm/md/lg/xl`)
- Existing components: Sidebar, message bubbles, tool call cards, thinking blocks, output panel, generate button
- Motion rules: minimal, 150ms ease-out for collapsibles, no decorative animation
- Icon library: Lucide throughout

---

## New Surface: TopBar Navigation

The TopBar gains a centered mode switcher. Three icon buttons representing `sessions | wiki | dashboard`.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  CCCT          [Sessions] [Wiki] [Dashboard]    [⚙] [●] │
└─────────────────────────────────────────────────────────┘
```

- App title: left-aligned, unchanged
- Mode switcher: centered, three icon buttons
- Right cluster: Settings icon + API server status dot (new)

**Mode switcher buttons:**
- Inactive: `text-muted` icon, transparent background
- Hover: `surface-overlay` background, `text-secondary` icon
- Active: `accent-subtle` background, `accent` icon, no border or underline
- Size: 32px hit target, 18px icon, 8px horizontal gap between buttons
- No labels - icons only. Tooltips on hover (native title attribute is sufficient)

**Icons:**
| Mode | Icon |
|---|---|
| Sessions | `MessageSquare` |
| Wiki | `BookOpen` |
| Dashboard | `BarChart2` |

---

## New Surface: Wiki

### WikiView Layout

Two-column layout within the center + right panel area:

```
┌──────────────────────────┬─────────────────────────────┐
│  WikiEntryList           │  WikiEntryDetail             │
│  ~340px                  │  flex-1                      │
│                          │  or WikiEntryForm            │
│                          │  or DraftReviewPanel         │
└──────────────────────────┴─────────────────────────────┘
```

Divider: 1px `surface-border`, no drag-to-resize in v2.

### WikiEntryList

- Background: `surface-raised` (matches sidebar)
- Header: "Wiki" label (11px, uppercase, `text-muted`) + "New Entry" button (right-aligned, small, accent-outlined style)
- Filter bar below header: category pill filters + search input
- Entries grouped by category, each group has a `text-muted` uppercase label (same pattern as sidebar project headers)
- Empty state: centered, `text-muted`, "No entries yet. Create one or run an AI audit."

**New Entry button (small variant):**
- Border: 1px `accent`
- Text: `accent`, 12px
- Background: transparent
- Hover: `accent-subtle` background
- This is the secondary button style. Distinct from the primary CTA (filled accent).

**Category group labels:**
```
DECISIONS          ← text-muted, 11px uppercase
FAILED ATTEMPTS
OPEN QUESTIONS
NOTES
```

**Filter pills:**
- Inactive: `surface-overlay` background, `text-secondary` text, 1px `surface-border`
- Active: `accent-subtle` background, `accent` text, 1px `accent` border
- Height: 24px, font: 12px, border-radius: 12px (fully rounded)
- Filters: one per category + "All" default

**Search input:**
- Full width of the list panel
- Background: `surface-overlay`
- Border: 1px `surface-border`, focus: 1px `accent`
- Placeholder: "Search entries…" in `text-muted`
- No search button - filters live as you type

### WikiEntryCard

Collapsed state in the list. Height: 44px.

```
[category dot]  Entry title                    [status badge]  [chevron]
```

- Category dot: 8px circle, color-coded (see category colors below)
- Title: `text-primary`, 14px, truncated with ellipsis
- Status badge: only shown for `draft` entries - small pill, `status-warning` color, "Draft" label, 11px
- Confirmed entries show no status badge - confirmed is the default, not worth labeling
- Hover: `surface-overlay` background
- Active (selected): `accent-subtle` background, `accent` left border 2px
- Padding: 12px horizontal, 0 vertical (height is fixed)

**Category dot colors:**
| Category | Color token | Hex |
|---|---|---|
| Decision | `status-info` | `#3b82f6` |
| Failed attempt | `status-error` | `#ef4444` |
| Open question | `status-warning` | `#eab308` |
| Note | `text-muted` | `#5c5a56` |

These colors appear only on the dot and the category label - never as backgrounds.

### WikiEntryDetail

Read view for a confirmed entry.

- Background: `surface-base`
- Padding: 24px
- Title: 18px, weight 600, `text-primary`
- Category + tags row below title: category badge + tag pills (same pill style as filter pills, inactive state)
- Metadata row: "Created [date] · Linked to [n] sessions" in `text-muted`, 12px
- Body: 14px, `text-primary`, rendered as markdown (same renderer as AssistantMessage)
- Linked sessions: collapsible section at bottom - "Linked Sessions (3)" with chevron, expands to list of session slugs as clickable chips
- Edit button: top-right of the panel, small secondary style (outline accent)
- Delete: text link below edit, `status-error` color, "Delete entry" - no icon, requires confirmation dialog

**Confirmation dialog (delete):**
- Modal overlay: `rgba(0,0,0,0.6)` backdrop
- Dialog card: `surface-raised` background, `surface-border` border, 8px border-radius
- Title: "Delete this entry?" - `text-primary`
- Body: entry title in quotes - `text-secondary`
- Buttons: "Cancel" (text, `text-secondary`) + "Delete" (filled, `status-error` background, dark text)
- No X button - use Cancel

### WikiEntryForm

Create and edit view. Same panel position as WikiEntryDetail.

- Background: `surface-base`, padding: 24px
- Title input: full width, 18px, weight 600 - styled like the detail title, not a typical input box. Placeholder: "Entry title"
- Category select: segmented control (4 options), not a dropdown. Each option is a pill, active state uses category dot color as background tint
- Body textarea: full width, min-height 160px, auto-grows, JetBrains Mono, 13px. Accepts markdown.
- Tags input: text field below body - comma-separated, converts to pills on blur. Placeholder: "Add tags…"
- Status toggle (for edit mode only, not create): "Draft / Confirmed" - small inline toggle, only shown when editing an existing draft
- Linked sessions: multi-select with search - shows session slugs from the current project. Placeholder: "Link to sessions…"
- Action row at bottom: "Save" (primary accent button) + "Cancel" (text, `text-secondary`)
- Validation: title and body required. Save button disabled if either is empty.

**Segmented control (category selector):**
```
[ Decision ]  [ Failed Attempt ]  [ Open Question ]  [ Note ]
```
- Inactive: `surface-overlay` background, `text-secondary` text
- Active: category-colored background at 15% opacity, category-colored text, 1px category-colored border
- Border-radius: 6px per segment, no gap between segments

### DraftReviewPanel

Shown in the list column when AI audit results are pending. Replaces (or sits above) the normal entry list.

- Header: "AI Audit Results - [n] suggestions" + "Confirm All" button (right-aligned, small primary)
- Each draft entry shown as an expanded card:
  - Category dot + title
  - Body (truncated to 3 lines, expandable)
  - Three actions: `Confirm` (accent text), `Edit` (muted text, opens form), `Discard` (error text)
- After all drafts are actioned, panel collapses back to the normal entry list
- Background of the panel: `accent-subtle` tinted header (`#041f0e`), then normal `surface-raised` below

---

## New Surface: Dashboard

### DashboardView Layout

Full-width (no right panel). Padding: 32px. Max content width: 900px, centered.

```
[StatsStrip]
[SessionTimeline]
[EntryActivity]
```

24px gap between each section.

### StatsStrip

Row of 4 stat cards. Each card:
- Background: `surface-raised`
- Border: 1px `surface-border`
- Border-radius: 8px
- Padding: 16px
- Value: 28px, weight 700, `text-primary`
- Label: 12px, `text-muted`
- No icons - numbers speak for themselves

Cards: Total Sessions · Wiki Entries · Entries by Category (stacked: 4 mini counts) · Drafts Pending

**Drafts Pending card:** if count > 0, value text uses `status-warning` color and the card gets a 1px `status-warning` border. Clicking the card navigates to wiki mode with draft filter active.

### Charts

Both charts use **Recharts**. Shared chart styles:

- Background: transparent (sits on `surface-base`)
- Grid lines: 1px `surface-border`, horizontal only
- Axis text: 11px, `text-muted`
- Tooltip: `surface-raised` background, 1px `surface-border`, `text-primary` value, `text-muted` label, 6px border-radius, no shadow
- No chart borders or enclosing boxes - charts float on the page background

**SessionTimeline (BarChart):**
- Bar color: `accent` at 60% opacity
- Hover bar: `accent` at 100% opacity
- X axis: week or month labels depending on date range
- Y axis: session count (integer, no decimals)

**EntryActivity (BarChart, stacked):**
- Stack colors: one per category (decision: `status-info`, failed attempt: `status-error`, open question: `status-warning`, note: `text-muted`)
- Same opacity rules as SessionTimeline

Section headers above each chart: 13px, weight 600, `text-secondary`, 16px margin-bottom.

---

## New Component: SessionSummaryPanel

Appears below the ConversationHeader when a summary has been generated. Collapsible.

- Background: `surface-raised`
- Border: 1px `surface-border`
- Border-radius: 6px
- Margin: 12px (sits between header and first message)
- Header row: "Session Summary" label (`text-secondary`, 12px) + chevron + "Regenerate" link (right-aligned, `text-muted`, 12px)
- Collapsed by default after first generation - user can expand
- Expanded: four sections in a 2×2 grid:
  - What was asked
  - Decisions made
  - Files touched
  - Open threads
- Each section: label (11px, uppercase, `text-muted`) + content (13px, `text-primary`)
- Files touched: rendered as `font-mono` chips

**Summarize button** (in ConversationHeader):
- Position: right side of header, next to existing header controls
- Idle state: `Sparkles` icon + "Summarize" text, outline secondary style
- Loading: spinner replaces icon, text stays, button disabled
- Has summary: `Check` icon + "Summarized", muted style - click reveals Regenerate option
- Same size and weight as existing header buttons

---

## New Indicator: API Server Status

Small dot in the top-right of the TopBar, left of the Settings icon.

- Server stopped: no dot rendered (not a grey dot - just absent)
- Server running: 8px filled circle, `accent` color, with a subtle pulse animation (2s ease-in-out infinite opacity 0.6→1.0→0.6)
- Tooltip on hover: "API running on port 3847"
- Clicking the dot opens Settings, scrolled to the API section

The pulse is the one exception to the "no decorative animation" rule - it serves a functional purpose (communicating an ongoing active state, not just a static indicator).

---

## New Iconography

Additions to the v1 icon table:

| Element | Icon |
|---|---|
| Sessions mode | `MessageSquare` |
| Wiki mode | `BookOpen` |
| Dashboard mode | `BarChart2` |
| New wiki entry | `Plus` |
| Confirm (audit) | `Check` |
| Discard (audit) | `X` |
| Summarize | `Sparkles` |
| API server running | `Wifi` (in Settings panel only - the TopBar uses a raw dot) |
| API server stopped | `WifiOff` (Settings panel only) |
| Decision category | `Lightbulb` |
| Failed attempt category | `XCircle` |
| Open question category | `HelpCircle` |
| Note category | `StickyNote` |

Category icons appear in Settings or empty states only. In the wiki list and cards, the colored dot is used instead - icons at that density create visual noise.

---

## What We Are Still Not Doing

Everything from the v1 "not doing" list, plus:

- No light mode
- No drag-to-resize panels
- No rich text editor in WikiEntryForm (markdown in a textarea is sufficient)
- No graph visualization of wiki entry relationships
- No animated page transitions between modes
- No onboarding flow or tooltips
