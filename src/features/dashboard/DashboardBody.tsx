import type { CoreState } from "@/types/core";
import { AgentColumn } from "@/features/agents/AgentColumn";
import { AGENT_ROSTER } from "@/features/agents/agents.data";
import { JarvisCore } from "./JarvisCore";
import { StatusLegendPlaceholder } from "./StatusLegendPlaceholder";
import styles from "./DashboardBody.module.css";

interface DashboardBodyProps {
  readonly coreState?: CoreState;
}

export function DashboardBody({ coreState }: DashboardBodyProps) {
  const midpoint = Math.ceil(AGENT_ROSTER.length / 2);
  const leftAgents = AGENT_ROSTER.slice(0, midpoint);
  const rightAgents = AGENT_ROSTER.slice(midpoint);

  return (
    <div className={styles.body}>
      <AgentColumn agents={leftAgents} />
      <JarvisCore state={coreState} />
      <AgentColumn agents={rightAgents}>
        <StatusLegendPlaceholder />
      </AgentColumn>
    </div>
  );
}
