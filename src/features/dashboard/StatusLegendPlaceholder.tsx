import { PanelFrame } from "@/components/PanelFrame";
import styles from "./StatusLegendPlaceholder.module.css";

/** S1 placeholder: label only, legend entries land in a later step. */
export function StatusLegendPlaceholder() {
  return (
    <PanelFrame as="section" ariaLabel="Status legend" className={styles.panel}>
      <div className={styles.row}>
        <span className={styles.label}>STATUS LEGEND</span>
      </div>
    </PanelFrame>
  );
}
