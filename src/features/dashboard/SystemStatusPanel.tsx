import { PanelFrame } from "@/components/PanelFrame";
import { SYSTEM_STATUS, SYSTEM_STATUS_TONE_COLOR } from "./systemStatus.data";
import styles from "./TopPanel.module.css";

/** S4: wired to the mock SYSTEM_STATUS fixture; a real feed lands in S5+. */
export function SystemStatusPanel() {
  const color = SYSTEM_STATUS_TONE_COLOR[SYSTEM_STATUS.tone];

  return (
    <PanelFrame as="section" ariaLabel="System status" className={styles.panel}>
      <div className={styles.row}>
        <span className={styles.label}>SYSTEM STATUS</span>
        <span className={styles.statusValue}>
          <span className={styles.statusDot} style={{ ["--status-color" as string]: color }} aria-hidden="true" />
          {SYSTEM_STATUS.label}
        </span>
      </div>
    </PanelFrame>
  );
}
