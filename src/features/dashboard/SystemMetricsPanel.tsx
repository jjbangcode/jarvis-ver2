import { PanelFrame } from "@/components/PanelFrame";
import { SYSTEM_METRICS } from "./systemMetrics.data";
import styles from "./TopPanel.module.css";

/** S4: wired to the mock SYSTEM_METRICS fixture; a real feed lands in S5+. */
export function SystemMetricsPanel() {
  return (
    <PanelFrame as="section" ariaLabel="System metrics" className={styles.panel}>
      <div className={styles.row}>
        <span className={styles.label}>SYSTEM METRICS</span>
        <dl className={styles.metricList}>
          {SYSTEM_METRICS.map((metric) => (
            <div key={metric.id} className={styles.metricItem}>
              <dt className={styles.metricLabel}>{metric.label}</dt>
              <dd className={styles.metricValue}>{metric.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </PanelFrame>
  );
}
