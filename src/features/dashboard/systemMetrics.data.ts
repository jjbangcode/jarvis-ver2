import type { MetricLabel } from "@/types/dashboard";

export interface SystemMetric extends MetricLabel {
  readonly value: string;
}

/**
 * MOCK fixture — a single illustrative snapshot of system telemetry. No
 * backend is connected yet (that lands in S5+); this is the only place
 * demo metric values are defined.
 */
export const SYSTEM_METRICS: readonly SystemMetric[] = [
  { id: "cpu", label: "CPU", value: "42%" },
  { id: "mem", label: "MEM", value: "3.1 GB" },
  { id: "net", label: "NET", value: "128 KB/s" },
  { id: "tasks", label: "TASKS", value: "3/7" },
];
