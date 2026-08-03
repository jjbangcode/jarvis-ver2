import type { AgentRun } from "@/types/dashboard";
import { PanelFrame } from "@/components/PanelFrame";
import { AGENT_STATUS_META } from "./agentStatus";
import { AgentIcon } from "./AgentIcon";
import styles from "./AgentCard.module.css";

interface AgentCardProps {
  readonly agent: AgentRun;
  /** Which column the card sits in — controls which edge the Core connection port renders on. */
  readonly side: "left" | "right";
}

/** Reusable HUD card for one agent's live status. Mock data only until S5 wires a real store. */
export function AgentCard({ agent, side }: AgentCardProps) {
  const indexLabel = String(agent.number).padStart(2, "0");
  const meta = AGENT_STATUS_META[agent.status];
  const recentLogs = agent.logs.slice(-3);
  const ariaLabel = `Agent ${indexLabel} ${agent.name}, status ${meta.label}, ${agent.activity}`;

  return (
    <div className={`${styles.cardWrap} ${side === "left" ? styles.portRight : styles.portLeft}`}>
      <PanelFrame as="article" ariaLabel={ariaLabel} className={styles.card} tabIndex={0}>
        <div className={styles.body}>
        <div className={styles.header}>
          <span
            className={styles.iconFrame}
            style={{ ["--status-color" as string]: meta.color }}
          >
            <AgentIcon number={agent.number} className={styles.icon} />
          </span>
          <div className={styles.titleBlock}>
            <span className={styles.index}>{indexLabel}</span>
            <span className={styles.name} title={agent.name}>
              {agent.name}
            </span>
          </div>
          <span className={styles.badge} style={{ ["--status-color" as string]: meta.color }}>
            <span className={styles.badgeGlyph} aria-hidden="true">
              {meta.glyph}
            </span>
            {meta.label}
          </span>
        </div>

        <p className={styles.activity} title={agent.activity}>
          {agent.activity}
        </p>

        {agent.status === "loading" && (
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuenow={agent.progress ?? undefined}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={agent.progress === null ? "Loading, progress unknown" : `Loading, ${agent.progress}% complete`}
          >
            {agent.progress === null ? (
              <div className={styles.progressIndeterminate} style={{ ["--status-color" as string]: meta.color }} />
            ) : (
              <div
                className={styles.progressFill}
                style={{ width: `${agent.progress}%`, ["--status-color" as string]: meta.color }}
              />
            )}
          </div>
        )}

        {recentLogs.length > 0 && (
          <ul className={styles.logList}>
            {recentLogs.map((line, i) => (
              <li key={i} className={styles.logLine} title={line}>
                {line}
              </li>
            ))}
          </ul>
        )}
        </div>
      </PanelFrame>
      <span
        className={styles.port}
        style={{ ["--status-color" as string]: meta.color }}
        data-agent-port={agent.id}
        aria-hidden="true"
      />
    </div>
  );
}
