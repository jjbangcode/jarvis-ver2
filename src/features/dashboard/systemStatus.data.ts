export type SystemStatusTone = "ok" | "warn" | "error";

export interface SystemStatusValue {
  readonly label: string;
  readonly tone: SystemStatusTone;
}

export const SYSTEM_STATUS_TONE_COLOR: Record<SystemStatusTone, string> = {
  ok: "#2fe6a6",
  warn: "#f5b93f",
  error: "#ff3b5c",
};

/**
 * MOCK fixture — a single illustrative snapshot of overall system health. No
 * backend is connected yet (that lands in S5+); this is the only place the
 * demo status value is defined.
 */
export const SYSTEM_STATUS: SystemStatusValue = {
  label: "OPERATIONAL",
  tone: "ok",
};
