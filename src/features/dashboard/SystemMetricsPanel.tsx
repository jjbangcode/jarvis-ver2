import { PanelFrame } from "@/components/PanelFrame";
import { SYSTEM_METRIC_LABELS } from "./systemMetrics.data";
import styles from "./TopPanel.module.css";

/** S1 placeholder: labels only, values intentionally left blank until real data lands. */
export function SystemMetricsPanel() {
  return (
    <PanelFrame as="section" ariaLabel="System metrics" className={styles.panel}>
      <div className={styles.row}>
        <span className={styles.label}>SYSTEM METRICS</span>
        <dl className={styles.metricList}>
          {SYSTEM_METRIC_LABELS.map((metric) => (
            <div key={metric.id} className={styles.metricItem}>
              <dt className={styles.metricLabel}>{metric.label}</dt>
              <dd className={styles.metricValue}>—</dd>
            </div>
          ))}
        </dl>
      </div>
    </PanelFrame>
  );
}
