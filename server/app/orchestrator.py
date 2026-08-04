from __future__ import annotations

import asyncio
import io
import re
import wave
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Awaitable, Callable

from agents.emotion.processor import build_system_prompt, normalize_emotion

from .ollama_client import stream_chat
from .tts.factory import TTSFactory

Send = Callable[[str, dict[str, Any]], Awaitable[None]]
SendAudio = Callable[[bytes], Awaitable[None]]

ORCHESTRATOR_ID = "orchestrator"
ORCHESTRATOR_NUMBER = 1
ORCHESTRATOR_NAME = "Orchestrator"

DEFAULT_MODEL = "qwen2.5:7b-instruct-q4_K_M"
# Smaller/faster models occasionally go incoherent — drift into other scripts,
# repeat tokens — more often than bigger ones. Retry once with this model if
# the fast model's output looks corrupted, instead of always paying the
# larger model's latency up front.
RELIABILITY_FALLBACK_MODEL = "qwen2.5:72b"
STREAM_PUSH_INTERVAL_S = 0.3

_HANGUL_RE = re.compile(r"[가-힣]")
_OTHER_SCRIPT_RE = re.compile(r"[぀-ヿ一-鿿฀-๿]")  # kana, CJK han, thai

# Just the wake word, nothing else ("자비스", "자비스야", "자비스 아", trailing
# punctuation) — answer instantly with a fixed greeting instead of sending
# a one-word "자비스" transcript to the LLM as if it were a real question.
_WAKE_WORD_RE = re.compile(r"^(자비스|자비스야|자비스아|jarvis)[!.?~,\s]*$", re.IGNORECASE)
WAKE_GREETING = "네, 주인님. 무엇을 도와드릴까요?"
# Cloned-voice TTS is unstable on its very first syllable — noticeable and
# annoying on a fixed, frequently-repeated phrase like this one. Play a
# pre-generated, pre-checked file for it instead of synthesizing fresh (and
# re-rolling the onset-glitch dice) every single time someone says the wake word.
WAKE_GREETING_AUDIO_PATH = Path(
    "/Users/su-younlee/Library/Application Support/JarvisHarness/voices/wake_greeting.wav"
)


def _looks_corrupted(text: str) -> bool:
    """Heuristic: a real Korean reply should be mostly Hangul. Low Hangul share
    among CJK/kana/thai script characters usually means the model drifted."""
    hangul = len(_HANGUL_RE.findall(text))
    other = len(_OTHER_SCRIPT_RE.findall(text))
    total = hangul + other
    if total < 10:
        return False
    return hangul / total < 0.6


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _wav_duration_seconds(audio: bytes) -> float:
    with wave.open(io.BytesIO(audio), "rb") as wav_file:
        return wav_file.getnframes() / wav_file.getframerate()


def _agent(
    status: str,
    activity: str,
    logs: list[str],
    *,
    progress: int | None = None,
    started_at: str | None = None,
    ended_at: str | None = None,
    error: str | None = None,
) -> dict[str, Any]:
    return {
        "id": ORCHESTRATOR_ID,
        "number": ORCHESTRATOR_NUMBER,
        "name": ORCHESTRATOR_NAME,
        "status": status,
        "activity": activity,
        "logs": logs[-3:],
        "progress": progress,
        "startedAt": started_at,
        "endedAt": ended_at,
        "error": error,
    }


async def run_orchestrator(
    command: str,
    model: str | None,
    send: Send,
    send_audio: SendAudio,
    detected_emotion: str = "neutral",
) -> None:
    """
    Drives the Orchestrator agent card + core state for one real command,
    end to end: a real Ollama call, streamed back as it generates. The other
    six agent cards keep running the frontend's local mock timeline — no
    real search/rerank tools exist yet for those.
    """
    model = model or DEFAULT_MODEL
    detected_emotion = normalize_emotion(detected_emotion)
    system_prompt = build_system_prompt(detected_emotion, command)
    started_at = _now()
    logs = [f"Received command: {command[:120]}", f"Model: {model}"]

    await send("listening", _agent("running", "Received command", logs, started_at=started_at))

    loop = asyncio.get_event_loop()

    is_wake_greeting = bool(_WAKE_WORD_RE.match(command.strip()))
    if is_wake_greeting:
        accumulated = WAKE_GREETING
        logs.append(f"Wake word only — skipping LLM: {accumulated}")
        await send("processing", _agent("running", "Wake word acknowledged", logs, started_at=started_at))
    else:
        await send("processing", _agent("running", "Generating response", logs, started_at=started_at))

        async def stream_once(active_model: str) -> str:
            text = ""
            last_push = loop.time()
            async for chunk in stream_chat(active_model, system_prompt, command):
                text += chunk
                now = loop.time()
                if now - last_push >= STREAM_PUSH_INTERVAL_S:
                    last_push = now
                    await send(
                        "processing",
                        _agent("running", "Generating response", logs + [text], started_at=started_at),
                    )
            return text

        accumulated = ""
        try:
            accumulated = await stream_once(model)
            if _looks_corrupted(accumulated) and model != RELIABILITY_FALLBACK_MODEL:
                logs.append(f"Response looked corrupted, retrying with {RELIABILITY_FALLBACK_MODEL}")
                await send(
                    "processing",
                    _agent("running", "Retrying with a more reliable model", logs, started_at=started_at),
                )
                accumulated = await stream_once(RELIABILITY_FALLBACK_MODEL)
        except Exception as exc:  # noqa: BLE001 — surface any failure (connection refused, model missing, ...) to the HUD
            message = str(exc) or exc.__class__.__name__
            error_agent = _agent(
                "error",
                "LLM request failed",
                logs + [message],
                started_at=started_at,
                ended_at=_now(),
                error=message,
            )
            await send("error", error_agent)
            await asyncio.sleep(2.5)
            await send("idle", error_agent)
            return

    ended_at = _now()
    final_logs = logs + [accumulated or "(empty response)"]
    final_agent = _agent("completed", "Response ready", final_logs, progress=100, started_at=started_at, ended_at=ended_at)

    await send("completed", final_agent)
    await asyncio.sleep(1.2)

    # Stream TTS chunk-by-chunk instead of waiting for the full ~6-7s synthesis:
    # the first chunk (audio + the "speaking" state) lands in under a second,
    # and remaining chunks keep arriving (and playing) while later ones synthesize.
    speak_seconds = 2.5
    speaking_started_at: float | None = None
    if is_wake_greeting and WAKE_GREETING_AUDIO_PATH.is_file():
        try:
            audio = WAKE_GREETING_AUDIO_PATH.read_bytes()
            await send_audio(audio)
            speaking_started_at = loop.time()
            await send("speaking", final_agent)
            speak_seconds = max(speak_seconds, _wav_duration_seconds(audio))
        except Exception as exc:  # noqa: BLE001 — fall through to live synthesis below
            print(f"Cached wake greeting playback failed: {exc}")
    if speaking_started_at is None and accumulated.strip():
        try:
            total_audio_seconds = 0.0
            async for chunk in TTSFactory.create().synthesize_stream(accumulated):
                await send_audio(chunk)
                total_audio_seconds += _wav_duration_seconds(chunk)
                if speaking_started_at is None:
                    speaking_started_at = loop.time()
                    await send("speaking", final_agent)
            if speaking_started_at is not None:
                elapsed_while_streaming = loop.time() - speaking_started_at
                speak_seconds = max(speak_seconds, total_audio_seconds - elapsed_while_streaming)
        except Exception as exc:  # noqa: BLE001 — TTS failure shouldn't break the text response
            print(f"TTS synthesis failed: {exc}")

    if speaking_started_at is None:
        await send("speaking", final_agent)
    await asyncio.sleep(max(speak_seconds, 0))
    await send("idle", final_agent)
