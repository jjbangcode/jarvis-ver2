import type { ReactNode } from "react";
import type { AgentPlaceholder } from "@/types/dashboard";
import { AgentCardPlaceholder } from "./AgentCardPlaceholder";
import styles from "./AgentColumn.module.css";

interface AgentColumnProps {
  readonly agents: readonly AgentPlaceholder[];
  readonly children?: ReactNode;
}

export function AgentColumn({ agents, children }: AgentColumnProps) {
  return (
    <div className={styles.column}>
      {agents.map((agent) => (
        <AgentCardPlaceholder key={agent.id} agent={agent} />
      ))}
      {children}
    </div>
  );
}
