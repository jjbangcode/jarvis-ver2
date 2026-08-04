from __future__ import annotations

import asyncio
import os
from concurrent.futures import ThreadPoolExecutor
from typing import AsyncIterator

import numpy as np

from .base import TranscriptEvent

SAMPLE_RATE = 16_000
# Whisper hallucinates fluent stock phrases (common Korean YouTube sign-offs,
# "감사합니다" etc.) when fed audio too short to actually contain speech — a
# well-known failure mode, not specific to this model. Skip the call entirely
# below this length instead of trusting whatever it invents from near-silence.
MIN_TRANSCRIBE_BYTES = int(SAMPLE_RATE * 2 * 0.4)  # ~400ms of 16-bit mono PCM

# In-process mlx-whisper (Apple Silicon GPU) — NOT the mlx_audio.server STT
# route, which crashes the whole (shared, TTS-serving) process on transcription
# requests (MLX GPU-stream threading bug: "no Stream(gpu, 1) in current thread").
# "turbo" over "small": "small" gave outright wrong transcriptions on real
# Korean audio in testing, so speed came at too high an accuracy cost here.
MODEL = os.environ.get("JARVIS_WHISPER_MODEL", "mlx-community/whisper-large-v3-turbo")

# The already-downloaded model is cached locally — skip mlx_whisper's HF Hub
# freshness check on every load (it was adding ~5s of network latency per call).
os.environ.setdefault("HF_HUB_OFFLINE", "1")

# MLX binds its GPU stream to whichever OS thread first touches it. asyncio.to_thread
# draws from a pool with several worker threads, so a later call can land on a thread
# MLX never initialized and crash with "no Stream(gpu, N) in current thread". Routing
# every mlx-whisper call through this single dedicated thread keeps it always the same.
_mlx_executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="mlx-whisper")


def _pcm16_to_float32(chunk: bytes) -> np.ndarray:
    return np.frombuffer(chunk, dtype="<i2").astype(np.float32) / 32768.0


def _is_repetition_loop(text: str) -> bool:
    """Whisper's well-known failure mode on short/ambiguous audio: greedy
    (temperature=0) decoding gets stuck repeating one word, often in the
    wrong language entirely (e.g. "consegue consegue consegue ...")."""
    words = text.split()
    if len(words) < 4:
        return False
    most_common_count = max(words.count(w) for w in set(words))
    return most_common_count / len(words) > 0.5


def _transcribe(audio: np.ndarray) -> str:
    import importlib

    import mlx_whisper

    # mlx_whisper.transcribe()'s cached ModelHolder gives corrupted/hallucinated
    # output (e.g. runs of repeated tokens) on the 2nd+ call to reuse it in the
    # same process — reproduced directly against mlx_whisper, not our code.
    # Forcing a fresh load per call avoids it; HF_HUB_OFFLINE above keeps that cheap.
    model_holder = importlib.import_module("mlx_whisper.transcribe").ModelHolder

    def run(temperature: tuple[float, ...]) -> str:
        model_holder.model = None
        model_holder.model_path = None
        result = mlx_whisper.transcribe(
            audio,
            path_or_hf_repo=MODEL,
            language="ko",
            verbose=False,
            condition_on_previous_text=False,
            temperature=temperature,
        )
        return str(result.get("text", "")).strip()

    text = run((0.0, 0.2, 0.4, 0.6, 0.8, 1.0))
    if _is_repetition_loop(text):
        # Retry skipping the greedy temp=0 pass that's prone to looping.
        text = run((0.6, 0.8, 1.0))
        if _is_repetition_loop(text):
            return ""
    return text


class MlxWhisperEngine:
    """Local, offline STT via mlx-whisper. One transcribe call per utterance, on `finish()`."""

    def __init__(self) -> None:
        self._buffer = bytearray()
        self._queue: asyncio.Queue[TranscriptEvent | None] = asyncio.Queue()

    async def feed(self, chunk: bytes) -> None:
        self._buffer.extend(chunk)

    async def events(self) -> AsyncIterator[TranscriptEvent]:
        while True:
            event = await self._queue.get()
            if event is None:
                return
            yield event

    async def finish(self) -> None:
        text = ""
        if len(self._buffer) >= MIN_TRANSCRIBE_BYTES:
            audio = _pcm16_to_float32(bytes(self._buffer))
            loop = asyncio.get_event_loop()
            text = await loop.run_in_executor(_mlx_executor, _transcribe, audio)
        await self._queue.put(TranscriptEvent(text=text, final=True))
        await self._queue.put(None)
