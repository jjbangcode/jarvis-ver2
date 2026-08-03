import { createContext } from "react";
import type { CoreState } from "@/types/core";
import type { AgentRun } from "@/types/dashboard";
import type { RuntimeScenario } from "./runtimeScenarios";

export interface RuntimeStoreValue {
  readonly coreState: CoreState;
  readonly agents: readonly AgentRun[];
  readonly scenario: RuntimeScenario;
  readonly setScenario: (scenario: RuntimeScenario) => void;
  /** Sends a command to the local orchestrator backend — the CommandInput's submit hook. */
  readonly triggerRun: (command: string) => void;
  /** Locally-pulled Ollama models available on the orchestrator backend. */
  readonly models: readonly string[];
  readonly selectedModel: string;
  readonly setSelectedModel: (model: string) => void;
}

export const RuntimeStoreContext = createContext<RuntimeStoreValue | null>(null);
