export interface MetricLabel {
  readonly id: string;
  readonly label: string;
}

/**
 * queued = 실행 대기열에 있음, waiting = 의존성 대기중, loading = 초기화/자원 로딩중,
 * running = 실행중, completed = 완료, error = 오류, hitl = 사용자 승인 대기,
 * cancelled = 취소됨.
 */
export type AgentStatus =
  | "queued"
  | "waiting"
  | "loading"
  | "running"
  | "completed"
  | "error"
  | "hitl"
  | "cancelled";

export interface AgentRun {
  readonly id: string;
  readonly number: number;
  readonly name: string;
  readonly status: AgentStatus;
  /** Current task, one line. */
  readonly activity: string;
  /** Most recent log lines; only the last 3 are shown. */
  readonly logs: readonly string[];
  /** 0-100 while loading with known progress; null renders an indeterminate animation. */
  readonly progress: number | null;
  readonly startedAt: string | null;
  readonly endedAt: string | null;
  readonly error: string | null;
}
