# Current State and Pending Cleanup

**Date**: 2026-05-08
**Purpose**: Status snapshot of the v2 narrative and a handoff note for what's left to do in this repo before moving on to the MCP Notes build.

---

## Where things stand

The v2 design and decision work is **complete**. What remains is mechanical cleanup of this repo so it presents cleanly as a portfolio artifact. After that, focus shifts to building MCP Notes in a separate repo.

---

## Done

### Decision and design docs (in `docs/decisions/`)
- [why-we-didnt-build-v2.md](why-we-didnt-build-v2.md) - the pivot rationale
- [recommended-workflow.md](recommended-workflow.md) - recommended workflow (no CCCT v2 build)
- [v2-design-archive.md](v2-design-archive.md) - design archive of what we chose not to build
- [mcp-notes-project.md](mcp-notes-project.md) - planning spec for the realized v2 outcome
- This file - current-state handoff

### Top-level
- [README.md](../../README.md) - rewritten as portfolio entry point telling the v1 → v2 → decision → MCP Notes story

---

## Pending - repo cleanup

These are small mechanical tasks to finish CCCT v1 as a clean shipped artifact. Estimated total: ~30 minutes.

### 1. Mark `docs/v2/` files as superseded

Add a one-line note at the very top of each file in `docs/v2/`:

```markdown
> **Superseded** by [docs/decisions/why-we-didnt-build-v2.md](../decisions/why-we-didnt-build-v2.md). Preserved as historical record of the original v2 plan.
```

Files to update:
- [docs/v2/PRD.md](../v2/PRD.md)
- [docs/v2/ARCHITECTURE.md](../v2/ARCHITECTURE.md)
- [docs/v2/DESIGN.md](../v2/DESIGN.md)
- [docs/v2/PROJECT_TRACKER.md](../v2/PROJECT_TRACKER.md)
- [docs/v2/CONTEXT_ARCHITECTURE_NOTES.md](../v2/CONTEXT_ARCHITECTURE_NOTES.md)

### 2. Decide on `src/lib/parserTest.ts`

This file appears to be a dev scratchpad from Phase 2 testing. Decide:
- **Keep** if it's referenced anywhere or has documentation value
- **Delete** if it's leftover scaffolding

Check with: `grep -r "parserTest" src/` to see if it's imported anywhere.

### 3. Verify the build still works

Sanity check before declaring v1 complete:

```bash
npm install
npm run tauri build
```

If it fails, fix the build. If it passes, v1 is shippable as-is.

### 4. Optional polish
- Tag `v1.0.0` release on GitHub: `git tag v1.0.0 && git push --tags`
- Add a screenshot or short demo gif to the README if you have one
- Update the License line in README.md to a real choice (MIT or whatever)

### 5. Optional: archive the GitHub repo

Once cleanup is done and you're confident no further changes will be made to CCCT itself, archive the repo on GitHub (Settings → Archive this repository).

Archiving signals "complete, intentionally not maintained" rather than "abandoned." This is a *positive* signal for a portfolio piece - paired with the decision docs, it tells the story of a finished project where you knew when to stop.

Don't archive until MCP Notes is shipped, in case you want to add a final link from CCCT's README pointing at the realized v2 outcome.

---

## Pending - outside this repo

These are not CCCT cleanup tasks; they're the next steps in the larger plan.

### Set up `~/notes/`
Path A folder structure on your local machine. Migrate this project's docs into `~/notes/projects/ccct/wiki/` so the ccct project's brain becomes part of your notes pile.

See [recommended-workflow.md § Migration from current state](recommended-workflow.md#migration-from-current-state) for the steps.

### Build MCP Notes
Separate repo, 1 weekend, time-boxed. Spec is fully written in [mcp-notes-project.md](mcp-notes-project.md). When ready to build, that doc is the entry point.

### Update CCCT README after MCP Notes ships
Once `mcp-notes` repo exists, add a link from CCCT's README pointing at it as the realized v2 outcome.

---

## Open questions - deferred

Decisions that don't need to be made now, captured here so they don't get lost:

- **MCP Notes implementation language**: Node.js (faster ship) vs Rust (more reps). Default: Node.js. Revisit if Rust practice is a higher priority than ship speed.
- **Whether to write a `mcp-notes-retrospective.md`** after 2-3 weeks of usage. Default: yes, it closes the narrative arc. Revisit only if there's nothing meaningful to retrospect on.
- **Whether to attempt Path B at all**: gated on real evidence per the [expansion criteria](mcp-notes-project.md#expansion-criteria). Default: no, hold the line.

---

## Status summary

| Stream | Status |
|---|---|
| v1 (CCCT desktop app) | Shipped, awaiting small cleanup |
| v2 design & decision | Complete |
| Path A workflow doc | Complete |
| Path B design archive | Complete |
| MCP Notes planning spec | Complete |
| Top-level README | Rewritten |
| Repo cleanup (this list) | Complete |
| MCP Notes build | In progress |
