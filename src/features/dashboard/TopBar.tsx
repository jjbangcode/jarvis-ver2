import { SystemStatusPanel } from "./SystemStatusPanel";
import { SystemMetricsPanel } from "./SystemMetricsPanel";
import { TitleBlock } from "./TitleBlock";
import styles from "./TopBar.module.css";

export function TopBar() {
  return (
    <div className={styles.topBar}>
      <SystemStatusPanel />
      <TitleBlock />
      <SystemMetricsPanel />
    </div>
  );
}
