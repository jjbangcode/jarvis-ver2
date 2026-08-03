import type { AgentRun } from "@/types/dashboard";
import { AGENT_STATUS_ORDER } from "./agentStatus";

/**
 * Dev-only fixtures for the runtime scenario toggle (RuntimeScenarioDev).
 * Never imported by production data paths — only by the dev toggle's
 * "ALL STATUSES" / "STRESS TEST" scenarios, so the "one live demo shown by
 * default" rule for the runtimeTimeline.ts pipeline still holds.
 */

/** One card per AgentStatus, so every status/color/glyph combination is visible at once. */
export const ALL_STATUS_FIXTURE: readonly AgentRun[] = AGENT_STATUS_ORDER.map((status, i) => ({
  id: `all-status-${status}`,
  number: i + 1,
  name: `${status[0].toUpperCase()}${status.slice(1)} Agent`,
  status,
  activity: `Demo activity for ${status} state`,
  logs: status === "waiting" || status === "queued" ? [] : [`Entered ${status} state`, "Sample log line two"],
  progress: status === "loading" ? 45 : null,
  startedAt: status === "queued" || status === "waiting" ? null : "2026-08-02T09:00:00Z",
  endedAt: status === "completed" || status === "cancelled" ? "2026-08-02T09:01:00Z" : null,
  error: status === "error" ? "Sample error message for layout testing" : null,
}));

/** Edge cases: long name/logs, empty logs, null vs numeric progress, HITL, cancelled. */
export const STRESS_TEST_FIXTURE: readonly AgentRun[] = [
  {
    id: "stress-long-name",
    number: 1,
    name: "Extremely Long Multi-Word Retrieval-Augmented Generation Context Assembly Agent",
    status: "running",
    activity: "Assembling an unusually long single-line activity description to verify truncation behaves correctly",
    logs: [
      "This is a deliberately long log line meant to exercise the truncate-with-tooltip behavior end to end",
      "Second log line",
      "Third log line",
      "Fourth log line (should not render — only the last 3 are kept)",
    ],
    progress: null,
    startedAt: "2026-08-02T09:00:00Z",
    endedAt: null,
    error: null,
  },
  {
    id: "stress-empty-logs",
    number: 2,
    name: "Empty Log Agent",
    status: "waiting",
    activity: "No logs yet",
    logs: [],
    progress: null,
    startedAt: null,
    endedAt: null,
    error: null,
  },
  {
    id: "stress-indeterminate",
    number: 3,
    name: "Indeterminate Progress Agent",
    status: "loading",
    activity: "Loading with unknown progress",
    logs: ["Progress unknown — indeterminate animation only"],
    progress: null,
    startedAt: "2026-08-02T09:00:00Z",
    endedAt: null,
    error: null,
  },
  {
    id: "stress-determinate",
    number: 4,
    name: "Determinate Progress Agent",
    status: "loading",
    activity: "Loading with known progress",
    logs: ["Progress known — numeric bar shown"],
    progress: 18,
    startedAt: "2026-08-02T09:00:00Z",
    endedAt: null,
    error: null,
  },
  {
    id: "stress-hitl",
    number: 5,
    name: "Approval Agent",
    status: "hitl",
    activity: "Awaiting human approval before deployment",
    logs: ["Draft change prepared", "Flagged as high risk"],
    progress: null,
    startedAt: "2026-08-02T09:00:00Z",
    endedAt: null,
    error: null,
  },
  {
    id: "stress-cancelled",
    number: 6,
    name: "Cancelled Agent",
    status: "cancelled",
    activity: "Run cancelled by user",
    logs: ["User requested cancellation"],
    progress: null,
    startedAt: "2026-08-02T09:00:00Z",
    endedAt: "2026-08-02T09:00:30Z",
    error: null,
  },
];
