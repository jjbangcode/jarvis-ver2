import { PanelFrame } from "@/components/PanelFrame";
import styles from "./TopPanel.module.css";

/** S1 placeholder: label only, no live telemetry wired up yet. */
export function SystemStatusPanel() {
  return (
    <PanelFrame as="section" ariaLabel="System status" className={styles.panel}>
      <div className={styles.row}>
        <span className={styles.label}>SYSTEM STATUS</span>
        <span className={styles.placeholder}>AWAITING DATA</span>
      </div>
    </PanelFrame>
  );
}
