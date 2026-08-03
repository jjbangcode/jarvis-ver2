import { useState, type FormEvent } from "react";
import { PanelFrame } from "@/components/PanelFrame";
import { useRuntimeStore } from "@/store/useRuntimeStore";
import styles from "./CommandInput.module.css";

/**
 * Inline command line, in the slot StatusLegend used to occupy. Submitting
 * sends the text (and the picked local Ollama model) to the FastAPI
 * backend's Orchestrator agent over the runtime store's WebSocket — see
 * server/. The other six agent cards are unaffected; they stay on the mock
 * timeline until real search/rerank tools exist for them.
 */
export function CommandInput() {
  const [value, setValue] = useState("");
  const { triggerRun, models, selectedModel, setSelectedModel } = useRuntimeStore();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!value.trim()) return;
    triggerRun(value);
    setValue("");
  }

  return (
    <PanelFrame as="section" ariaLabel="Command input" className={styles.panel}>
      <div className={styles.wrap}>
        <select
          className={styles.modelSelect}
          value={selectedModel}
          onChange={(event) => setSelectedModel(event.target.value)}
          aria-label="Local model"
          disabled={models.length === 0}
        >
          {models.length === 0 ? (
            <option value={selectedModel}>{selectedModel}</option>
          ) : (
            models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))
          )}
        </select>
        <form className={styles.form} onSubmit={handleSubmit}>
          <span className={styles.prompt} aria-hidden="true">
            ›
          </span>
          <input
            className={styles.input}
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Enter a command…"
            aria-label="Command"
            autoComplete="off"
          />
        </form>
      </div>
    </PanelFrame>
  );
}
