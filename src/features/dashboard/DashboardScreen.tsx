import { useState } from "react";
import type { CoreState } from "@/types/core";
import { AgentDataPreviewDev } from "@/features/agents/AgentDataPreviewDev";
import { getAgentFixture, type AgentFixtureKey } from "@/features/agents/agentFixtures";
import { DashboardShell } from "./DashboardShell";
import { TopBar } from "./TopBar";
import { DashboardBody } from "./DashboardBody";
import { ExecutionFooter } from "./ExecutionFooter";
import { CoreStatePreviewDev } from "./CoreStatePreviewDev";

export function DashboardScreen() {
  // TEMPORARY: dev-only state previews, see CoreStatePreviewDev / AgentDataPreviewDev.
  const [coreState, setCoreState] = useState<CoreState>("idle");
  const [agentFixture, setAgentFixture] = useState<AgentFixtureKey>("default");

  return (
    <DashboardShell>
      <TopBar />
      <CoreStatePreviewDev value={coreState} onChange={setCoreState} />
      <AgentDataPreviewDev value={agentFixture} onChange={setAgentFixture} />
      <DashboardBody coreState={coreState} agents={getAgentFixture(agentFixture)} />
      <ExecutionFooter />
    </DashboardShell>
  );
}
