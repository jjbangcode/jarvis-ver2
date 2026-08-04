from __future__ import annotations

import tempfile
import threading
import time
import unittest
from pathlib import Path

from agents.emotion.processor import JarvisVoiceProcessor, build_system_prompt


class JarvisVoiceProcessorTests(unittest.TestCase):
    def test_stt_and_emotion_start_in_parallel(self) -> None:
        barrier = threading.Barrier(2, timeout=1.0)
        captured_prompt = ""

        def stt_runner(_: Path) -> str:
            barrier.wait()
            return "오늘 정말 좋은 날이야"

        def emotion_runner(_: Path) -> str:
            barrier.wait()
            return "joy"

        def chat_runner(_: str, system_prompt: str, __: str) -> str:
            nonlocal captured_prompt
            captured_prompt = system_prompt
            return "저도 기분이 좋습니다. 멋진 하루를 이어가시죠."

        with tempfile.NamedTemporaryFile(suffix=".wav") as audio:
            result = JarvisVoiceProcessor(
                stt_runner=stt_runner,
                emotion_runner=emotion_runner,
                chat_runner=chat_runner,
            ).process_audio(audio.name)

        self.assertEqual(result.emotion, "happy")
        self.assertIn("upbeat", captured_prompt)
        self.assertIn(result.transcript, captured_prompt)

    def test_emotion_failure_falls_back_to_neutral(self) -> None:
        def failed_emotion(_: Path) -> str:
            raise RuntimeError("model unavailable")

        with tempfile.NamedTemporaryFile(suffix=".wav") as audio:
            result = JarvisVoiceProcessor(
                stt_runner=lambda _: "상태를 알려줘",
                emotion_runner=failed_emotion,
                chat_runner=lambda *_: "모든 시스템이 정상입니다.",
            ).process_audio(audio.name)

        self.assertEqual(result.emotion, "neutral")

    def test_emotion_timeout_falls_back_to_neutral(self) -> None:
        def slow_emotion(_: Path) -> str:
            time.sleep(0.05)
            return "sad"

        with tempfile.NamedTemporaryFile(suffix=".wav") as audio:
            result = JarvisVoiceProcessor(
                emotion_timeout_seconds=0.001,
                stt_runner=lambda _: "괜찮아",
                emotion_runner=slow_emotion,
                chat_runner=lambda *_: "알겠습니다.",
            ).process_audio(audio.name)

        self.assertEqual(result.emotion, "neutral")

    def test_dynamic_prompt_tone_rules(self) -> None:
        self.assertIn("empathetic", build_system_prompt("sadness", "힘들어"))
        self.assertIn("solution-oriented", build_system_prompt("fearful", "걱정돼"))
        self.assertIn("classic polite", build_system_prompt("unknown", "보고해"))

    def test_extracts_highest_scoring_emotion2vec_label(self) -> None:
        result = [{"labels": ["angry", "neutral", "sad"], "scores": [0.1, 0.8, 0.1]}]
        self.assertEqual(JarvisVoiceProcessor._extract_primary_emotion(result), "neutral")


if __name__ == "__main__":
    unittest.main()
