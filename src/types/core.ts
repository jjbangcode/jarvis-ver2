/**
 * idle = 대기중, listening = 음성인식중, processing = 처리중,
 * completed = 작업완료, speaking = 답변중, error = 오류.
 */
export type CoreState = "idle" | "listening" | "processing" | "completed" | "speaking" | "error";

export interface CoreStateConfig {
  readonly label: string;
  /** Primary accent for the core glow and brighter particles. */
  readonly accentPrimary: string;
  /** Secondary accent blended into the particle field and ambient glow. */
  readonly accentSecondary: string;
  /** Whether the core pulses/deforms dynamically (used while speaking). */
  readonly dynamic: boolean;
}
