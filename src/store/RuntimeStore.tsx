import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { computeLiveSnapshot } from "@/features/dashboard/runtimeSimulation";
import { RUNTIME_SCENARIOS, type RuntimeScenario } from "./runtimeScenarios";
import { RuntimeStoreContext, type RuntimeStoreValue } from "./RuntimeStoreContext";
import { useOrchestratorConnection } from "./useOrchestratorConnection";

const TICK_MS = 500;

/**
 * Central runtime store for the dashboard. While `scenario` is "live":
 * six of the seven agent cards + the idle/ambient coreState still come from
 * a scripted mock timeline ticked on an interval (runtimeTimeline.ts) — no
 * real search/rerank tools exist yet for those. The Orchestrator card is
 * real: `useOrchestratorConnection` talks to the local FastAPI+Ollama
 * backend (server/) over a WebSocket and its snapshots override both the
 * orchestrator agent entry and coreState whenever a run is in flight. The
 * other scenarios pin a static edge-case fixture for visual QA.
 */
export function RuntimeStoreProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenario] = useState<RuntimeScenario>("live");
  const [snapshot, setSnapshot] = useState(() => computeLiveSnapshot(0));
  const startRef = useRef(0);

  useEffect(() => {
    if (scenario !== "live") return undefined;

    startRef.current = performance.now();
    const tick = () => setSnapshot(computeLiveSnapshot(performance.now() - startRef.current));

    // Deferred rather than called synchronously in the effect body, so this
    // resync doesn't trigger a cascading render during commit.
    const resetId = window.setTimeout(tick, 0);
    const intervalId = window.setInterval(tick, TICK_MS);

    return () => {
      window.clearTimeout(resetId);
      window.clearInterval(intervalId);
    };
  }, [scenario]);

  const { orchestratorOverride, coreStateOverride, models, selectedModel, setSelectedModel, sendCommand } =
    useOrchestratorConnection();

  const value = useMemo<RuntimeStoreValue>(() => {
    const shared = { scenario, setScenario, triggerRun: sendCommand, models, selectedModel, setSelectedModel };
    if (scenario === "live") {
      const agents = orchestratorOverride
        ? snapshot.agents.map((agent) => (agent.id === orchestratorOverride.id ? orchestratorOverride : agent))
        : snapshot.agents;
      return {
        coreState: coreStateOverride ?? snapshot.coreState,
        isAssistantBusy: coreStateOverride !== null,
        agents,
        ...shared,
      };
    }
    return { coreState: "idle", isAssistantBusy: false, agents: RUNTIME_SCENARIOS[scenario].agents ?? [], ...shared };
  }, [scenario, snapshot, orchestratorOverride, coreStateOverride, models, selectedModel, setSelectedModel, sendCommand]);

  return <RuntimeStoreContext.Provider value={value}>{children}</RuntimeStoreContext.Provider>;
}
