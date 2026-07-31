import type { CoreState } from "@/types/core";
import { CORE_STATE_CONFIG } from "./jarvisCoreStates";
import styles from "./CoreStatePreviewDev.module.css";

interface CoreStatePreviewDevProps {
  readonly value: CoreState;
  readonly onChange: (state: CoreState) => void;
}

const STATES = Object.keys(CORE_STATE_CONFIG) as readonly CoreState[];

/**
 * TEMPORARY dev-only control to preview Core colors/motion per state.
 * Remove once real state wiring lands and this has been visually confirmed.
 */
export function CoreStatePreviewDev({ value, onChange }: CoreStatePreviewDevProps) {
  return (
    <div className={styles.row} aria-label="Core state preview (dev only)">
      {STATES.map((s) => (
        <button
          key={s}
          type="button"
          className={s === value ? styles.active : styles.button}
          onClick={() => onChange(s)}
        >
          {CORE_STATE_CONFIG[s].label}
        </button>
      ))}
    </div>
  );
}
