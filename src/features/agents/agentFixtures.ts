import type { AgentRun } from "@/types/dashboard";
import { AGENT_RUNS } from "./agents.data";
import { ALL_STATUS_FIXTURE, STRESS_TEST_FIXTURE } from "./agents.devFixtures";

export type AgentFixtureKey = "default" | "allStatuses" | "stress";

export const AGENT_FIXTURES: Record<AgentFixtureKey, { label: string; agents: readonly AgentRun[] }> = {
  default: { label: "DEFAULT", agents: AGENT_RUNS },
  allStatuses: { label: "ALL STATUSES", agents: ALL_STATUS_FIXTURE },
  stress: { label: "STRESS TEST", agents: STRESS_TEST_FIXTURE },
};

export function getAgentFixture(key: AgentFixtureKey): readonly AgentRun[] {
  return AGENT_FIXTURES[key].agents;
}
