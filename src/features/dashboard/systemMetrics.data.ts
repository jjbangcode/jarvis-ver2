import type { MetricLabel } from "@/types/dashboard";

/** Labels only for S1 — no live values are wired up yet. */
export const SYSTEM_METRIC_LABELS: readonly MetricLabel[] = [
  { id: "cpu", label: "CPU" },
  { id: "mem", label: "MEM" },
  { id: "net", label: "NET" },
  { id: "tasks", label: "TASKS" },
];
