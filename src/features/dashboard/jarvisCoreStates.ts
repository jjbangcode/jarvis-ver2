import type { CoreState, CoreStateConfig } from "@/types/core";

/**
 * Per-state look for the Core visualization. Colors drive both the center
 * glow and the particle field (per direct user feedback the core should
 * fully shift color per state, not just an accent ring). "speaking" is the
 * only state where the core pulses dynamically, mimicking active voice output.
 *
 * Color categories follow the spec table: IDLE/WAITING = muted violet,
 * LISTENING/RUNNING = cyan+purple, LOADING/PROCESSING = amber+purple,
 * COMPLETED = cyan-green, ERROR = red-magenta. "speaking" is an extra
 * state layered on top for the future TTS/RESPONDING phase.
 */
export const CORE_STATE_CONFIG: Record<CoreState, CoreStateConfig> = {
  idle: { label: "IDLE", accentPrimary: "#67708f", accentSecondary: "#7c3aed", dynamic: false },
  listening: { label: "LISTENING", accentPrimary: "#22e6f2", accentSecondary: "#a855f7", dynamic: false },
  processing: { label: "PROCESSING", accentPrimary: "#f5b93f", accentSecondary: "#a855f7", dynamic: false },
  completed: { label: "COMPLETED", accentPrimary: "#2fe6a6", accentSecondary: "#22e6f2", dynamic: false },
  speaking: { label: "SPEAKING", accentPrimary: "#ffffff", accentSecondary: "#22e6f2", dynamic: true },
  error: { label: "ERROR", accentPrimary: "#ff3b5c", accentSecondary: "#e4148c", dynamic: false },
};
