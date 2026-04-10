// Indexer - caches conversation metadata so the sidebar loads instantly.
// Instead of parsing every .jsonl file on every launch, we parse once and
// store the results in index.json (AppData). On subsequent launches, only
// new files get parsed.

import type { ProjectEntry } from "../types";
import { parseJsonl } from "./parser";
import { invoke } from "@tauri-apps/api/core";

// One entry per .jsonl file - just enough metadata to populate the sidebar.
export type IndexEntry = {
  path: string          // full path to .jsonl file
  projectName: string   // decoded display name
  firstMessage: string  // truncated first user message (~80 chars)
  date: string          // ISO date string from first record
  sessionId: string
}

export type Index = {
  version: number
  entries: IndexEntry[]
  lastBuilt: string     // ISO timestamp
}

// FULL REBUILD - reads and parses every .jsonl file across all projects.
// Slow path: only called on first launch (no index.json exists) or when the
// user clicks the re-index button. Loops through each project's files,
// reads the content via Tauri, parses the JSONL, and extracts metadata
// (first user message, date, sessionId) into IndexEntry objects.
export async function buildIndex(projectEntries: ProjectEntry[]): Promise<Index> {
  const nested = await Promise.all(
    projectEntries.map(async (projectEntry) => {
      // grab projectEntry's name
      const name = projectEntry.name;

      const entries = await Promise.all(
        projectEntry.files.map(async (file) => {
          // then grab the file path
          const path = file.path;

          const content = await invoke<string>("read_file", { path: file.path });
          const parsed = parseJsonl(content);

          // then grab the firstMessage
          const firstUserMessage = parsed.messages.find((message) => message.role === "user");
          const firstMessage = firstUserMessage?.text?.slice(0, 80) ?? "";

          return {
            path: path,
            projectName: name,
            firstMessage: firstMessage,
            date: parsed.firstMessageTime,
            sessionId: parsed.sessionId,
          }
        })
      );
      return entries;
    })
  );
  const allEntries = nested.flat();

  return {
    version: 1,
    entries: allEntries,
    lastBuilt: new Date().toISOString()
  }
}


// INCREMENTAL UPDATE -- the fast path, used on every normal launch after the first.
// Compares file paths on disk against what's already in the index.
// Filters down to only new (unindexed) files, passes those to buildIndex,
// then merges the new entries with the existing ones. If nothing is new,
// returns the existing index as-is without parsing anything.
export async function updateIndex(existing: Index, projectEntries: ProjectEntry[]): Promise<Index> {
  // Set to track existing entries
  const existingPaths = new Set(existing.entries.map((entry) => entry.path));

  const filtered = projectEntries
    .map((projectEntry) => {
      const newFiles = projectEntry.files.filter((file) => !existingPaths.has(file.path));

      return {
        name: projectEntry.name,
        path: projectEntry.path,
        files: newFiles
      }
    })
    .filter((entry) => entry.files.length > 0);

  if (filtered.length === 0) {
    return {
      version: 1,
      entries: existing.entries,
      lastBuilt: new Date().toISOString()
    }
  }

  const indexCompleted = await buildIndex(filtered);

  const merged = existing.entries.concat(indexCompleted.entries);

  return {
    version: 1,
    entries: merged,
    lastBuilt: new Date().toISOString()
  }
}
