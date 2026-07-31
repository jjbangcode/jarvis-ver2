import type { MetricLabel } from "@/types/dashboard";

/** Labels only for S1 — execution telemetry is wired up in a later step. */
export const EXECUTION_FOOTER_FIELDS: readonly MetricLabel[] = [
  { id: "executionId", label: "EXECUTION ID" },
  { id: "task", label: "TASK" },
  { id: "start", label: "START TIME" },
  { id: "elapsed", label: "ELAPSED TIME" },
  { id: "eta", label: "EST. COMPLETION" },
  { id: "throughput", label: "THROUGHPUT" },
];
