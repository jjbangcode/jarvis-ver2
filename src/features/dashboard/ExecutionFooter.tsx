import { PanelFrame } from "@/components/PanelFrame";
import { EXECUTION_FOOTER_FIELDS } from "./executionFooter.data";
import styles from "./ExecutionFooter.module.css";

/** S1 placeholder: labels only, no live execution values yet. */
export function ExecutionFooter() {
  return (
    <PanelFrame as="section" ariaLabel="Execution summary" className={styles.panel}>
      <dl className={styles.row}>
        {EXECUTION_FOOTER_FIELDS.map((field) => (
          <div key={field.id} className={styles.field}>
            <dt className={styles.label}>{field.label}</dt>
            <dd className={styles.value}>—</dd>
          </div>
        ))}
      </dl>
    </PanelFrame>
  );
}
