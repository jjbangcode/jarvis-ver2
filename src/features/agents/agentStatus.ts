import type { AgentStatus } from "@/types/dashboard";

export interface AgentStatusMeta {
  readonly label: string;
  /** Badge/icon-frame accent color. */
  readonly color: string;
  /** Non-color cue (glyph) so status is never conveyed by color alone. */
  readonly glyph: string;
  readonly description: string;
}

/** Status → color/label per the spec's status table. */
export const AGENT_STATUS_META: Record<AgentStatus, AgentStatusMeta> = {
  queued: { label: "QUEUED", color: "#67708f", glyph: "···", description: "Queued for execution" },
  waiting: { label: "WAITING", color: "#67708f", glyph: "❚❚", description: "Waiting on a dependency" },
  loading: { label: "LOADING", color: "#f5b93f", glyph: "◐", description: "Loading / initializing" },
  running: { label: "RUNNING", color: "#22e6f2", glyph: "▶", description: "Actively running" },
  completed: { label: "COMPLETED", color: "#2fe6a6", glyph: "✓", description: "Completed successfully" },
  error: { label: "ERROR", color: "#ff3b5c", glyph: "✕", description: "Failed with an error" },
  hitl: { label: "HITL", color: "#ff8a3d", glyph: "!", description: "Waiting on user approval" },
  cancelled: { label: "CANCELLED", color: "#4b5268", glyph: "◼", description: "Cancelled" },
};

/** Display order used by the status legend and the "all statuses" dev fixture. */
export const AGENT_STATUS_ORDER: readonly AgentStatus[] = [
  "queued",
  "waiting",
  "loading",
  "running",
  "completed",
  "error",
  "hitl",
  "cancelled",
];
