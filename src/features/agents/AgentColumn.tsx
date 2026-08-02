import type { ReactNode } from "react";
import type { AgentRun } from "@/types/dashboard";
import { AgentCard } from "./AgentCard";
import styles from "./AgentColumn.module.css";

interface AgentColumnProps {
  readonly agents: readonly AgentRun[];
  readonly side: "left" | "right";
  readonly children?: ReactNode;
}

export function AgentColumn({ agents, side, children }: AgentColumnProps) {
  return (
    <div className={styles.column}>
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} side={side} />
      ))}
      {children}
    </div>
  );
}
