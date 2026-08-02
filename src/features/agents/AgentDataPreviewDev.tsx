import { AGENT_FIXTURES, type AgentFixtureKey } from "./agentFixtures";
import styles from "./AgentDataPreviewDev.module.css";

interface AgentDataPreviewDevProps {
  readonly value: AgentFixtureKey;
  readonly onChange: (key: AgentFixtureKey) => void;
}

/**
 * TEMPORARY dev-only control to preview every AgentCard status/edge case
 * without a real backend (S5+). Makes clear the data is mock, per spec.
 */
export function AgentDataPreviewDev({ value, onChange }: AgentDataPreviewDevProps) {
  return (
    <div className={styles.row} aria-label="Agent data preview (dev only, mock data)">
      <span className={styles.mockTag}>MOCK DATA</span>
      {(Object.keys(AGENT_FIXTURES) as AgentFixtureKey[]).map((key) => (
        <button
          key={key}
          type="button"
          className={key === value ? styles.active : styles.button}
          onClick={() => onChange(key)}
        >
          {AGENT_FIXTURES[key].label}
        </button>
      ))}
    </div>
  );
}
