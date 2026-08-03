import { useCallback, useEffect, useRef, useState } from "react";
import type { CoreState } from "@/types/core";
import type { AgentRun } from "@/types/dashboard";

/** Local FastAPI + Ollama orchestrator (see server/) — dev-only, hardcoded. */
const ORCHESTRATOR_HTTP_URL = "http://localhost:8787";
const ORCHESTRATOR_WS_URL = "ws://localhost:8787/ws/runtime";
const PREFERRED_DEFAULT_MODEL = "qwen2.5:7b-instruct-q4_K_M";

interface SnapshotMessage {
  readonly type: "snapshot";
  readonly coreState: CoreState;
  readonly agent: AgentRun;
}

function isSnapshotMessage(message: unknown): message is SnapshotMessage {
  return typeof message === "object" && message !== null && (message as { type?: unknown }).type === "snapshot";
}

export interface OrchestratorConnection {
  /** Sticky: the last agent snapshot the backend sent, kept visible until a new command overwrites it. */
  readonly orchestratorOverride: AgentRun | null;
  /** Only set while a backend run is actively in flight; cleared once the backend settles back to "idle". */
  readonly coreStateOverride: CoreState | null;
  /** Locally-pulled Ollama models, fetched from the backend's /models on mount. */
  readonly models: readonly string[];
  readonly selectedModel: string;
  readonly setSelectedModel: (model: string) => void;
  readonly sendCommand: (text: string) => void;
}

/**
 * Connects to the local FastAPI+Ollama orchestrator backend (server/) over
 * a single WebSocket and exposes its live push updates for the Orchestrator
 * agent only — the other six agent cards stay on the frontend's local mock
 * simulation until real tools (search index, reranker, ...) exist for them.
 */
export function useOrchestratorConnection(): OrchestratorConnection {
  const [orchestratorOverride, setOrchestratorOverride] = useState<AgentRun | null>(null);
  const [coreStateOverride, setCoreStateOverride] = useState<CoreState | null>(null);
  const [models, setModels] = useState<readonly string[]>([]);
  const [selectedModel, setSelectedModel] = useState(PREFERRED_DEFAULT_MODEL);
  const socketRef = useRef<WebSocket | null>(null);
  const pendingRef = useRef<{ text: string; model: string } | null>(null);
  const selectedModelRef = useRef(selectedModel);

  useEffect(() => {
    selectedModelRef.current = selectedModel;
  }, [selectedModel]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${ORCHESTRATOR_HTTP_URL}/models`)
      .then((response) => response.json())
      .then((data: { models?: readonly string[] }) => {
        if (cancelled) return;
        const fetched = data.models ?? [];
        setModels(fetched);
        setSelectedModel((current) => (fetched.includes(current) ? current : (fetched[0] ?? current)));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const socket = new WebSocket(ORCHESTRATOR_WS_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      if (pendingRef.current !== null) {
        socket.send(JSON.stringify({ type: "command", ...pendingRef.current }));
        pendingRef.current = null;
      }
    };

    socket.onmessage = (event) => {
      let message: unknown;
      try {
        message = JSON.parse(event.data as string);
      } catch {
        return;
      }
      if (!isSnapshotMessage(message)) return;
      setOrchestratorOverride(message.agent);
      setCoreStateOverride(message.coreState === "idle" ? null : message.coreState);
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, []);

  const sendCommand = useCallback((text: string) => {
    const command = { text, model: selectedModelRef.current };
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "command", ...command }));
    } else {
      pendingRef.current = command;
    }
  }, []);

  return { orchestratorOverride, coreStateOverride, models, selectedModel, setSelectedModel, sendCommand };
}
