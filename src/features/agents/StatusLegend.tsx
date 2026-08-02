import { PanelFrame } from "@/components/PanelFrame";
import { AGENT_STATUS_META, AGENT_STATUS_ORDER } from "./agentStatus";
import styles from "./StatusLegend.module.css";

/** Legend for every AgentStatus color/glyph, placed bottom-right of the agent grid. */
export function StatusLegend() {
  return (
    <PanelFrame as="section" ariaLabel="Status legend" className={styles.panel}>
      <div className={styles.row}>
        <span className={styles.title}>STATUS LEGEND</span>
        <ul className={styles.list}>
          {AGENT_STATUS_ORDER.map((status) => {
            const meta = AGENT_STATUS_META[status];
            return (
              <li key={status} className={styles.item}>
                <span
                  className={styles.swatch}
                  style={{ ["--status-color" as string]: meta.color }}
                  aria-hidden="true"
                >
                  {meta.glyph}
                </span>
                <span className={styles.itemLabel}>{meta.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </PanelFrame>
  );
}
