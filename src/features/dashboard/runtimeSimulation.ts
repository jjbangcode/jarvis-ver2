import type { CoreState } from "@/types/core";
import type { AgentRun } from "@/types/dashboard";
import { RUNTIME_CYCLE_MS, RUNTIME_TIMELINE } from "./runtimeTimeline";

export interface RuntimeSnapshot {
  readonly coreState: CoreState;
  readonly agents: readonly AgentRun[];
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/**
 * Pure function of elapsed time: looks up which keyframe window the given
 * elapsed time falls in (looping every RUNTIME_CYCLE_MS) and returns that
 * keyframe's snapshot, except any agent still "loading" has its progress
 * linearly ramped toward the next keyframe's value (or 100, if it leaves
 * "loading" there) so the progress bar animates smoothly between keyframes
 * instead of jumping.
 */
export function computeLiveSnapshot(elapsedMs: number): RuntimeSnapshot {
  const t = ((elapsedMs % RUNTIME_CYCLE_MS) + RUNTIME_CYCLE_MS) % RUNTIME_CYCLE_MS;

  let index = 0;
  for (let i = 0; i < RUNTIME_TIMELINE.length; i += 1) {
    if (RUNTIME_TIMELINE[i].atMs <= t) index = i;
    else break;
  }

  const current = RUNTIME_TIMELINE[index];
  const next = RUNTIME_TIMELINE[index + 1];
  const nextAtMs = next ? next.atMs : RUNTIME_CYCLE_MS;
  const segmentProgress = clamp01((t - current.atMs) / Math.max(1, nextAtMs - current.atMs));

  const agents = current.agents.map((agent) => {
    if (agent.status !== "loading" || agent.progress === null) return agent;
    const nextAgent = next?.agents.find((a) => a.id === agent.id);
    const endProgress = nextAgent && nextAgent.status === "loading" ? (nextAgent.progress ?? 100) : 100;
    const progress = Math.round(agent.progress + (endProgress - agent.progress) * segmentProgress);
    return { ...agent, progress };
  });

  return { coreState: current.coreState, agents };
}
