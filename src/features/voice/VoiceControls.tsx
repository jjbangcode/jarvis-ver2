import { useCallback, useState } from "react";
import { useVoiceInput, type SttMode } from "./useVoiceInput";
import { EMOTION_META, normalizeEmotion, publishEmotionReading } from "./emotionReadings";
import styles from "./VoiceControls.module.css";

interface VoiceControlsProps {
  readonly onFinalText: (text: string, emotion: string) => void;
  /** Suppress new-utterance detection while true (e.g. the assistant is mid-turn/speaking). */
  readonly paused?: boolean;
}

interface HeardEntry {
  readonly id: number;
  readonly text: string;
  readonly emotion: string;
}

const MODE_LABEL: Record<SttMode, string> = { local: "LOCAL", cloud: "CLOUD" };
const MAX_HISTORY = 5;

function emotionIcon(emotion: string): string {
  return EMOTION_META[normalizeEmotion(emotion)].icon;
}

/**
 * Mode toggle (local MLX Whisper vs. real-time Deepgram, see server/app/stt/)
 * + an always-listening toggle (client-side VAD auto-detects each utterance's
 * start/end, see useVoiceInput — no per-utterance button press). Shows the
 * live interim transcript while talking, plus a short scrollback of what was
 * actually heard, so it's visible what's about to be sent as a command.
 */
export function VoiceControls({ onFinalText, paused = false }: VoiceControlsProps) {
  const [mode, setMode] = useState<SttMode>("local");
  const [history, setHistory] = useState<readonly HeardEntry[]>([]);

  const handleFinalText = useCallback(
    (text: string, emotion: string) => {
      setHistory((current) => [{ id: Date.now(), text, emotion }, ...current].slice(0, MAX_HISTORY));
      publishEmotionReading(text, emotion);
      onFinalText(text, emotion);
    },
    [onFinalText],
  );

  const voiceInput = useVoiceInput(mode, handleFinalText, paused);

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <div className={styles.modeToggle} role="radiogroup" aria-label="Speech-to-text mode">
          {(["local", "cloud"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={mode === option}
              disabled={voiceInput.enabled}
              className={`${styles.modeButton} ${mode === option ? styles.modeButtonActive : ""}`}
              onClick={() => setMode(option)}
            >
              {MODE_LABEL[option]}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`${styles.micButton} ${voiceInput.enabled ? styles.micButtonActive : ""} ${
            voiceInput.isSpeaking ? styles.micButtonSpeaking : ""
          }`}
          onClick={voiceInput.toggle}
          aria-pressed={voiceInput.enabled}
          aria-label={voiceInput.enabled ? "Disable always-listening voice input" : "Enable always-listening voice input"}
        >
          <span className={styles.micDot} aria-hidden="true" />
          {voiceInput.isSpeaking ? "LISTENING" : voiceInput.enabled ? "MIC ON" : "MIC OFF"}
        </button>
        {voiceInput.error ? (
          <span className={styles.error}>{voiceInput.error}</span>
        ) : (
          <span className={styles.interim}>{voiceInput.interimText}</span>
        )}
      </div>
      {history.length > 0 && (
        <ul className={styles.history} aria-label="Recognized voice commands">
          {history.map((entry) => (
            <li
              key={entry.id}
              className={styles.historyItem}
              data-emotion={normalizeEmotion(entry.emotion)}
              aria-label={`${entry.text}. Detected emotion: ${EMOTION_META[normalizeEmotion(entry.emotion)].label}`}
            >
              <span className={styles.historyPrompt} aria-hidden="true">
                <span className={styles.emotionLight} />
              </span>
              <span className={styles.historyText}>{entry.text}</span>
              <span className={styles.emotionIcon} aria-hidden="true">
                {emotionIcon(entry.emotion)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
