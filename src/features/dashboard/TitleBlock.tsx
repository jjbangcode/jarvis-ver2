import styles from "./TitleBlock.module.css";

export function TitleBlock() {
  return (
    <div className={styles.block}>
      <h1 className={styles.title}>JARVIS</h1>
      <p className={styles.subtitle}>MULTI-AGENT EXECUTION SCREEN</p>
    </div>
  );
}
