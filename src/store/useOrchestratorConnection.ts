import { useCallback, useEffect, useRef, useState } from "react";
import type { CoreState } from "@/types/core";
import type { AgentRun } from "@/types/dashboard";

/** Local FastAPI + Ollama orchestrator (see server/) — dev-only, hardcoded. */
const ORCHESTRATOR_HTTP_URL = "http://localhost:8787";
const ORCHESTRATOR_WS_URL = "ws://localhost:8787/ws/runtime";
const PREFERRED_DEFAULT_MODEL = "qwen2.5:14b";

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
  readonly sendCommand: (text: string, emotion?: string) => void;
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
  const pendingRef = useRef<{ text: string; model: string; emotion: string } | null>(null);
  const selectedModelRef = useRef(selectedModel);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingAudioRef = useRef(false);

  useEffect(() => {
    selectedModelRef.current = selectedModel;
  }, [selectedModel]);

  // TTS now streams as several independently-playable WAV chunks (see
  // orchestrator.py) instead of one big blob, so the first sound lands well
  // before the full reply finishes synthesizing — queue and chain them.
  const playNextAudio = useCallback(function playNextAudio() {
    const url = audioQueueRef.current.shift();
    if (!url) {
      isPlayingAudioRef.current = false;
      return;
    }
    isPlayingAudioRef.current = true;
    const audio = new Audio(url);
    const advance = () => {
      URL.revokeObjectURL(url);
      playNextAudio();
    };
    audio.addEventListener("ended", advance);
    audio.play().catch(advance);
  }, []);

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
    socket.binaryType = "arraybuffer";
    socketRef.current = socket;

    socket.onopen = () => {
      if (pendingRef.current !== null) {
        socket.send(JSON.stringify({ type: "command", ...pendingRef.current }));
        pendingRef.current = null;
      }
    };

    socket.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        const blob = new Blob([event.data], { type: "audio/wav" });
        const url = URL.createObjectURL(blob);
        audioQueueRef.current.push(url);
        if (!isPlayingAudioRef.current) playNextAudio();
        return;
      }
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
  }, [playNextAudio]);

  const sendCommand = useCallback((text: string, emotion = "neutral") => {
    const command = { text, model: selectedModelRef.current, emotion };
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "command", ...command }));
    } else {
      pendingRef.current = command;
    }
  }, []);

  return { orchestratorOverride, coreStateOverride, models, selectedModel, setSelectedModel, sendCommand };
}
