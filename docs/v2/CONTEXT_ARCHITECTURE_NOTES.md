> **Superseded** by [docs/decisions/why-we-didnt-build-v2.md](../decisions/why-we-didnt-build-v2.md). Preserved as historical record of the original v2 plan.

# Context Architecture Notes
## Nodes / Skills / CCCT Hybrid Analysis

---

## Background

CCCT v2 uses a Karpathy 3-folder / Claude docs hybrid methodology for context preservation - a human-curated, AI-assisted SQLite wiki fed by on-demand AI audits, exposed via a local REST API.

Two alternative approaches were considered as potentially superior:

1. **Nodes** - context as a knowledge graph / RAG layer, semantically queryable by any AI
2. **Skill folders** - context as executable instruction sets and tool definitions

The question was whether either alternative genuinely outperforms CCCT's current approach, or whether CCCT's "appropriately scoped" framing was a bias artifact from defending existing work.

---

## Honest Assessment of the Alternatives

### Nodes

Not overkill in 2025 - a local vector store is not heavy infrastructure. The nodes approach would beat CCCT on the most important dimension: **passive extraction with semantic retrieval**, meaning relevant context surfaces automatically without the user having to remember to run anything.

The "appropriately scoped" dismissal was partially anchored to protecting the investment in phases 1–5, not pure architectural reasoning.

**Genuine ceiling**: higher than CCCT v2 for the core problem of reducing context loss friction.

**Why we're not rebuilding toward it**: the infrastructure cost isn't zero, CCCT's trust model (draft → confirmed) is a genuine differentiator that nodes systems typically lack, and the REST API in Sprint 6 is the right bridge point if nodes-style retrieval is added later.

### Skill folders

Conflates "what to do" with "what was done." Instructions decay when code changes - but so do wiki entries, so this isn't a decisive argument against it. The stronger objection is that skill folders don't accumulate knowledge over time; they're static instruction sets that require manual maintenance and have a lower ceiling than a queryable knowledge base.

---

## What CCCT Should Borrow From Nodes

### 1. Passive extraction (highest leverage)

The current audit is user-triggered. The system's value is proportional to how consistently the user remembers to run it - a fragile dependency.

**Proposed change**: when CCCT detects sessions that haven't been audited yet (on app open, or on first load of a session), automatically run the audit in the background → produces drafts. User still confirms. No API call if nothing is new.

This flips extraction from human-triggered to passive while keeping the trust model intact. The DraftReviewPanel already exists for the review step.

### 2. Entry-to-entry relationships

Entries currently link to sessions only. A decision entry should be able to reference the failed attempt that informed it.

**Proposed change**: add `linked_entry_ids TEXT DEFAULT '[]'` alongside the existing `linked_session_ids` column. No graph infrastructure - same JSON array pattern already in the schema.

### 3. Staleness signals

Nodes systems track whether knowledge is still current. CCCT could heuristically flag entries as potentially stale if: the sessions they were extracted from are old, or file paths mentioned in the body appear in recent edit tool calls from newer sessions.

No embeddings needed - string matching against the session index is sufficient for a first pass.

### 4. Relevance-based retrieval for context transfer

The OutputPanel currently offers category toggles. A better model: the user describes what the new session is about, CCCT uses SQLite FTS5 to pull the most relevant confirmed entries rather than all entries of a given category.

The REST API in Sprint 6 can expose this as a `?q=` query parameter on the wiki endpoint.

---

## What Not to Import

- **Vector embeddings** - disproportionate for single-user local use at this scale
- **Auto-confirmation of audit results** - removes the trust model, which is CCCT's actual differentiator over a raw nodes system
- **Cross-project linking** - deferred, adds complexity before the core is proven

---

## Summary

CCCT doesn't need to become a nodes system. The three highest-value imports are:

| Change | What it fixes | Where it lands |
|---|---|---|
| Passive audit on new session detection | Removes reliance on user remembering to audit | Sprint 2 audit flow |
| Entry-to-entry links | Lightweight relationship graph | Sprint 1 schema, Sprint 2 UI |
| FTS5 relevance retrieval | Surfaces right entries without category browsing | Sprint 5 / REST API |

The existing architecture accommodates all three without structural changes.
