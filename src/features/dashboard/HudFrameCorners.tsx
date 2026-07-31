import styles from "./HudFrameCorners.module.css";

const CORNERS = [
  styles.topLeft,
  styles.topRight,
  styles.bottomLeft,
  styles.bottomRight,
] as const;

/** Decorative L-shaped corner brackets for the outer HUD frame. */
export function HudFrameCorners() {
  return (
    <div className={styles.layer} aria-hidden="true">
      {CORNERS.map((cornerClass) => (
        <span key={cornerClass} className={`${styles.corner} ${cornerClass}`} />
      ))}
    </div>
  );
}
