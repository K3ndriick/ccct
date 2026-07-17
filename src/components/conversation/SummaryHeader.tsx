import type { ParsedConversation } from "../../types";
import type { SessionMeta, TouchedFile } from "../../lib/sessionMeta";

const dotClass: Record<TouchedFile["kind"], string> = {
  write: "bg-tool-write",
  edit: "bg-tool-edit",
  read: "bg-tool-read",
};

function shortCwd(cwd?: string): string | null {
  if (!cwd) return null;
  const parts = cwd.replace(/\\/g, "/").split("/").filter(Boolean);
  return parts.slice(-2).join("/");
}

function truncate(s: string, n: number): string {
  const one = s.replace(/\s+/g, " ").trim();
  return one.length > n ? one.slice(0, n).trimEnd() + "…" : one;
}

type Props = { conversation: ParsedConversation; meta: SessionMeta };

export default function SummaryHeader({ conversation, meta }: Props) {
  const cwd = shortCwd(conversation.cwd);
  const title = truncate(meta.gist || "Conversation", 90);

  return (
    <div className="min-w-0">
      {cwd && <p className="font-mono text-[11px] text-text-faint mb-1.5 truncate">{cwd}</p>}

      <div className="flex items-start gap-4">
        <h2
          className="flex-1 min-w-0 text-[15px] font-semibold tracking-tight text-text-primary leading-snug"
          title={meta.gist}
        >
          {title}
        </h2>
        <div className="flex-shrink-0 flex items-center gap-2 font-mono text-[11px] text-text-muted pt-0.5">
          {meta.model && <span>{meta.model}</span>}
          <span className="text-text-faint">·</span>
          <span className="tabular-nums">{meta.messageCount} msgs</span>
          <span className="text-text-faint">·</span>
          <span className="tabular-nums">~{meta.tokenLabel} tok</span>
          {meta.durationLabel && (
            <>
              <span className="text-text-faint">·</span>
              <span className="tabular-nums">{meta.durationLabel}</span>
            </>
          )}
        </div>
      </div>

      {meta.files.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {meta.files.slice(0, 8).map((f) => (
            <span
              key={f.path}
              title={f.path}
              className="inline-flex items-center gap-1.5 font-mono text-[11px] text-text-secondary bg-surface-raised border border-surface-border-strong rounded-md px-2 py-[3px]"
            >
              <span className={`w-1.5 h-1.5 rounded-sm flex-shrink-0 ${dotClass[f.kind]}`} />
              {f.name}
            </span>
          ))}
          {meta.files.length > 8 && (
            <span className="self-center font-mono text-[11px] text-text-faint">+{meta.files.length - 8} more</span>
          )}
        </div>
      )}
    </div>
  );
}
