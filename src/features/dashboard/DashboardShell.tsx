import type { ReactNode } from "react";
import { HudFrameCorners } from "./HudFrameCorners";
import styles from "./DashboardShell.module.css";

interface DashboardShellProps {
  readonly children: ReactNode;
}

/** Full-viewport HUD chrome: background grid/vignette, outer frame, corner brackets. */
export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className={`hud-grid hud-vignette ${styles.shell}`}>
      <div className={styles.frameBorder} aria-hidden="true" />
      <HudFrameCorners />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
