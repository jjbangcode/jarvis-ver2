import { RUNTIME_SCENARIOS, type RuntimeScenario } from "@/store/runtimeScenarios";
import styles from "./RuntimeScenarioDev.module.css";

interface RuntimeScenarioDevProps {
  readonly value: RuntimeScenario;
  readonly onChange: (scenario: RuntimeScenario) => void;
}

/**
 * TEMPORARY dev-only control. "LIVE" is the default scripted real-time
 * simulation (see runtimeTimeline.ts); the other two pin a static edge-case
 * fixture so every AgentCard status/edge case can still be inspected without
 * waiting for the live run to reach it. Remove once a real backend (S6+)
 * makes scenario-pinning unnecessary.
 */
export function RuntimeScenarioDev({ value, onChange }: RuntimeScenarioDevProps) {
  return (
    <div className={styles.row} aria-label="Runtime scenario preview (dev only, mock data)">
      <span className={styles.mockTag}>MOCK DATA</span>
      {(Object.keys(RUNTIME_SCENARIOS) as RuntimeScenario[]).map((key) => (
        <button
          key={key}
          type="button"
          className={key === value ? styles.active : styles.button}
          onClick={() => onChange(key)}
        >
          {RUNTIME_SCENARIOS[key].label}
        </button>
      ))}
    </div>
  );
}
