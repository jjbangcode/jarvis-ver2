import { useEffect, useState } from "react";
import {
  EMOTION_META,
  subscribeToEmotionReadings,
  type EmotionReading,
  type EmotionTone,
} from "@/features/voice/emotionReadings";
import styles from "./EmotionAgentPanel.module.css";

const TONES = Object.keys(EMOTION_META) as EmotionTone[];
const MAX_READINGS = 3;

/** Display-only feed driven by the existing JARVIS mic; it never opens a second microphone. */
export function EmotionAgentPanel() {
  const [readings, setReadings] = useState<readonly EmotionReading[]>([]);

  useEffect(
    () =>
      subscribeToEmotionReadings((reading) => {
        setReadings((current) => [reading, ...current].slice(0, MAX_READINGS));
      }),
    [],
  );

  return (
    <div className={styles.panel}>
      <div className={styles.legend} aria-label="Emotion color legend">
        {TONES.map((tone) => (
          <span key={tone} data-emotion={tone} title={EMOTION_META[tone].label}>
            <span className={styles.legendLight} />
            {EMOTION_META[tone].label}
          </span>
        ))}
      </div>

      {readings.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.scanLine} />
          음성 감정 대기 중
        </div>
      ) : (
        <ul className={styles.readings} aria-label="Recent detected emotions">
          {readings.map((reading) => (
            <li key={reading.id} data-emotion={reading.tone}>
              <span className={styles.readingLight} aria-hidden="true" />
              <span className={styles.readingText}>{reading.text}</span>
              <span className={styles.readingIcon} title={EMOTION_META[reading.tone].label}>
                {EMOTION_META[reading.tone].icon}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
