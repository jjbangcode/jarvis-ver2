export type EmotionTone = "happy" | "sad" | "angry" | "fearful" | "disgusted" | "surprised" | "neutral";

export interface EmotionReading {
  readonly id: number;
  readonly text: string;
  readonly tone: EmotionTone;
}

export interface EmotionMeta {
  readonly label: string;
  readonly icon: string;
}

export const EMOTION_META: Record<EmotionTone, EmotionMeta> = {
  happy: { label: "행복", icon: "😊" },
  sad: { label: "슬픔", icon: "😢" },
  angry: { label: "분노", icon: "😠" },
  fearful: { label: "두려움", icon: "😨" },
  disgusted: { label: "혐오", icon: "🤢" },
  surprised: { label: "놀람", icon: "😲" },
  neutral: { label: "중립", icon: "😐" },
};

const READING_EVENT = "jarvis:emotion-reading";

export function normalizeEmotion(emotion: string): EmotionTone {
  const normalized = emotion.toLowerCase();
  if (["happy", "joy"].includes(normalized)) return "happy";
  if (["sad", "sadness", "tired"].includes(normalized)) return "sad";
  if (["angry", "anger"].includes(normalized)) return "angry";
  if (["fearful", "fear"].includes(normalized)) return "fearful";
  if (["disgusted", "disgust"].includes(normalized)) return "disgusted";
  if (["surprised", "surprise"].includes(normalized)) return "surprised";
  return "neutral";
}

export function publishEmotionReading(text: string, emotion: string): EmotionReading {
  const reading = { id: Date.now(), text, tone: normalizeEmotion(emotion) };
  window.dispatchEvent(new CustomEvent<EmotionReading>(READING_EVENT, { detail: reading }));
  return reading;
}

export function subscribeToEmotionReadings(listener: (reading: EmotionReading) => void): () => void {
  const handleReading = (event: Event) => listener((event as CustomEvent<EmotionReading>).detail);
  window.addEventListener(READING_EVENT, handleReading);
  return () => window.removeEventListener(READING_EVENT, handleReading);
}
