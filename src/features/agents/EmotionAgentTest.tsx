import { VoiceControls } from "@/features/voice/VoiceControls";
import styles from "./EmotionAgentTest.module.css";

/** Small dev window for testing STT + emotion2vec without dispatching a JARVIS command. */
export function EmotionAgentTest() {
  return (
    <main className={`hud-grid hud-vignette ${styles.page}`}>
      <section className={styles.window} aria-label="Emotion agent test">
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>JARVIS · AGENT 01</span>
            <h1 className={styles.title}>EMOTION TEST BROWSER</h1>
          </div>
          <span className={styles.status}>READY</span>
        </header>

        <p className={styles.help}>
          MIC을 켜고 말해보세요. 인식된 문장마다 감정에 맞는 색이 자동으로 입혀집니다.
        </p>
        <div className={styles.legend} aria-label="감정 색상 범례">
          <span data-emotion="happy">😊<small>행복</small></span>
          <span data-emotion="sad">😢<small>슬픔</small></span>
          <span data-emotion="angry">😠<small>분노</small></span>
          <span data-emotion="fearful">😨<small>두려움</small></span>
          <span data-emotion="disgusted">🤢<small>혐오</small></span>
          <span data-emotion="surprised">😲<small>놀람</small></span>
          <span data-emotion="neutral">😐<small>중립</small></span>
        </div>
        <VoiceControls onFinalText={() => undefined} />
      </section>
    </main>
  );
}
