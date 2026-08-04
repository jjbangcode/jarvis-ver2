import { useCallback, useEffect, useRef, useState } from "react";
import { downsampleTo16k, floatTo16BitPcm } from "./pcm";

/** Local FastAPI voice STT endpoint (see server/) — dev-only, hardcoded, mirrors useOrchestratorConnection. */
const VOICE_WS_URL = "ws://localhost:8787/ws/voice";

// Always-on listening (same idea as the old project's JARVIS_VAD_THRESHOLD):
// enable once, and every utterance after that starts and ends itself — no
// per-utterance button press. `paused` (driven by whether the assistant is
// mid-turn) keeps it from opening a new segment while it's talking back.
// Tuned loose on purpose: missing real speech (has to be repeated) is a worse
// experience than an occasional false trigger — those are now caught downstream
// instead (backend's MIN_TRANSCRIBE_BYTES gate + hallucination phrase list).
const VAD_THRESHOLD = 0.012;
const SILENCE_TIMEOUT_MS = 1200;
const MIN_SPEECH_FRAMES_TO_TRIGGER = 2;
// Keep a rolling buffer of recent frames while idle and prepend it once a
// segment triggers — otherwise the frames spent confirming "this is really
// speech" (MIN_SPEECH_FRAMES_TO_TRIGGER of them) are never sent at all, so
// every utterance loses its first ~100-200ms. That's exactly why "자비스"
// was coming out as "르치이" — Whisper was reconstructing from a clipped word.
const PRE_ROLL_FRAMES = 5;

export type SttMode = "local" | "cloud";

interface TranscriptMessage {
  readonly type: "transcript";
  readonly text: string;
  readonly final: boolean;
  readonly emotion?: string;
}

interface ErrorMessage {
  readonly type: "error";
  readonly message: string;
}

function isTranscriptMessage(message: unknown): message is TranscriptMessage {
  return typeof message === "object" && message !== null && (message as { type?: unknown }).type === "transcript";
}

function isErrorMessage(message: unknown): message is ErrorMessage {
  return typeof message === "object" && message !== null && (message as { type?: unknown }).type === "error";
}

export interface VoiceInput {
  /** Whether always-listening mode is on (mic armed, watching for speech). */
  readonly enabled: boolean;
  /** Whether it's actively capturing an utterance right now (for the "LISTENING" pulse). */
  readonly isSpeaking: boolean;
  readonly interimText: string;
  readonly error: string | null;
  readonly toggle: () => void;
}

/**
 * Always-on mic capture: once enabled, it watches audio energy for speech
 * onset/offset itself (client-side VAD) and opens one /ws/voice session per
 * utterance, streaming raw PCM16 16kHz to the FastAPI STTFactory backend
 * (server/app/stt/). `mode` picks the backend per session: "local" (MLX
 * Whisper, offline) or "cloud" (Deepgram, real-time). `paused` suppresses
 * new-utterance detection (e.g. while the assistant itself is speaking).
 */
export function useVoiceInput(
  mode: SttMode,
  onFinalText: (text: string, emotion: string) => void,
  paused: boolean,
): VoiceInput {
  const [enabled, setEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const pendingChunksRef = useRef<ArrayBuffer[]>([]);
  const phaseRef = useRef<"idle" | "opening" | "recording">("idle");
  const lastSpeechAtRef = useRef(0);
  const consecutiveSpeechFramesRef = useRef(0);
  const preRollRef = useRef<ArrayBuffer[]>([]);
  const pausedRef = useRef(paused);
  const modeRef = useRef(mode);
  const onFinalTextRef = useRef(onFinalText);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    onFinalTextRef.current = onFinalText;
  }, [onFinalText]);

  const teardownMic = useCallback(() => {
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    audioContextRef.current?.close();
    processorRef.current = null;
    sourceRef.current = null;
    streamRef.current = null;
    audioContextRef.current = null;
  }, []);

  const endSegment = useCallback(() => {
    const socket = socketRef.current;
    socketRef.current = null;
    pendingChunksRef.current = [];
    phaseRef.current = "idle";
    consecutiveSpeechFramesRef.current = 0;
    preRollRef.current = [];
    setIsSpeaking(false);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "stop" }));
    } else {
      socket?.close();
    }
  }, []);

  const beginSegment = useCallback(() => {
    phaseRef.current = "opening";
    setIsSpeaking(true);
    setInterimText("");

    const socket = new WebSocket(VOICE_WS_URL);
    socketRef.current = socket;
    pendingChunksRef.current = [];

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "start", mode: modeRef.current }));
      phaseRef.current = "recording";
      for (const chunk of pendingChunksRef.current) socket.send(chunk);
      pendingChunksRef.current = [];
    };

    socket.onmessage = (event) => {
      let message: unknown;
      try {
        message = JSON.parse(event.data as string);
      } catch {
        return;
      }
      if (isErrorMessage(message)) {
        setError(message.message);
        return;
      }
      if (!isTranscriptMessage(message)) return;
      if (message.final) {
        setInterimText("");
        if (message.text.trim()) onFinalTextRef.current(message.text, message.emotion ?? "neutral");
      } else {
        setInterimText(message.text);
      }
    };

    socket.onerror = () => setError("Voice connection failed");
    socket.onclose = () => {
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, []);

  const toggle = useCallback(() => {
    if (enabled) {
      setEnabled(false);
      if (phaseRef.current !== "idle") endSegment();
      teardownMic();
      return;
    }

    setError(null);
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        streamRef.current = stream;
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;
        // ScriptProcessorNode is deprecated but universally supported and simple; an
        // AudioWorklet would be the modern replacement if this needs to get fancier.
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (event) => {
          const input = event.inputBuffer.getChannelData(0);
          const downsampled = downsampleTo16k(input, audioContext.sampleRate);
          const pcm = floatTo16BitPcm(downsampled);

          let sumSquares = 0;
          for (let i = 0; i < downsampled.length; i++) sumSquares += downsampled[i] * downsampled[i];
          const rms = Math.sqrt(sumSquares / downsampled.length);
          const now = performance.now();
          const speaking = rms > VAD_THRESHOLD;

          if (phaseRef.current === "idle") {
            preRollRef.current.push(pcm);
            if (preRollRef.current.length > PRE_ROLL_FRAMES) preRollRef.current.shift();
            if (!speaking || pausedRef.current) {
              consecutiveSpeechFramesRef.current = 0;
              return;
            }
            consecutiveSpeechFramesRef.current += 1;
            if (consecutiveSpeechFramesRef.current < MIN_SPEECH_FRAMES_TO_TRIGGER) return;
            lastSpeechAtRef.current = now;
            const preRoll = preRollRef.current;
            preRollRef.current = [];
            beginSegment();
            pendingChunksRef.current.push(...preRoll);
            return;
          }

          // "opening" or "recording": keep streaming this utterance.
          if (speaking) lastSpeechAtRef.current = now;
          if (phaseRef.current === "opening") {
            pendingChunksRef.current.push(pcm);
          } else {
            const socket = socketRef.current;
            if (socket && socket.readyState === WebSocket.OPEN) socket.send(pcm);
          }
          if (now - lastSpeechAtRef.current > SILENCE_TIMEOUT_MS) endSegment();
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
        setEnabled(true);
      })
      .catch(() => setError("Microphone access denied"));
  }, [enabled, beginSegment, endSegment, teardownMic]);

  useEffect(
    () => () => {
      teardownMic();
      socketRef.current?.close();
      socketRef.current = null;
    },
    [teardownMic],
  );

  return { enabled, isSpeaking, interimText, error, toggle };
}
