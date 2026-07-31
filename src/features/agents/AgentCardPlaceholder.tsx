import type { AgentPlaceholder } from "@/types/dashboard";
import { PanelFrame } from "@/components/PanelFrame";
import styles from "./AgentCardPlaceholder.module.css";

interface AgentCardPlaceholderProps {
  readonly agent: AgentPlaceholder;
}

/** S1 placeholder: number + name only, no status/logs/icon yet (added in S3). */
export function AgentCardPlaceholder({ agent }: AgentCardPlaceholderProps) {
  const indexLabel = String(agent.index).padStart(2, "0");
  return (
    <PanelFrame as="article" ariaLabel={`Agent ${indexLabel} ${agent.name}`} className={styles.card}>
      <div className={styles.row}>
        <span className={styles.index}>{indexLabel}</span>
        <span className={styles.name}>{agent.name}</span>
      </div>
    </PanelFrame>
  );
}
