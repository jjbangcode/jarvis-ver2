import type { AgentRun } from "@/types/dashboard";
import { ALL_STATUS_FIXTURE, STRESS_TEST_FIXTURE } from "@/features/agents/agents.devFixtures";

export type RuntimeScenario = "live" | "allStatuses" | "stress";

export const RUNTIME_SCENARIOS: Record<RuntimeScenario, { readonly label: string; readonly agents?: readonly AgentRun[] }> = {
  live: { label: "LIVE" },
  allStatuses: { label: "ALL STATUSES", agents: ALL_STATUS_FIXTURE },
  stress: { label: "STRESS TEST", agents: STRESS_TEST_FIXTURE },
};
