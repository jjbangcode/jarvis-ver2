import type { CoreState } from "@/types/core";
import type { AgentRun } from "@/types/dashboard";
import { AgentColumn } from "@/features/agents/AgentColumn";
import { AGENT_RUNS } from "@/features/agents/agents.data";
import { StatusLegend } from "@/features/agents/StatusLegend";
import { JarvisCore } from "./JarvisCore";
import styles from "./DashboardBody.module.css";

interface DashboardBodyProps {
  readonly coreState?: CoreState;
  /** Overridable for the dev state-preview toggle; defaults to the mock AGENT_RUNS fixture. */
  readonly agents?: readonly AgentRun[];
}

export function DashboardBody({ coreState, agents = AGENT_RUNS }: DashboardBodyProps) {
  const midpoint = Math.ceil(agents.length / 2);
  const leftAgents = agents.slice(0, midpoint);
  const rightAgents = agents.slice(midpoint);

  return (
    <div className={styles.body}>
      <AgentColumn agents={leftAgents} side="left" />
      <JarvisCore state={coreState} />
      <AgentColumn agents={rightAgents} side="right">
        <StatusLegend />
      </AgentColumn>
    </div>
  );
}
