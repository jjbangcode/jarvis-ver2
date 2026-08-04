from __future__ import annotations

import os

# Must run before anything (funasr, mlx_whisper, ...) imports huggingface_hub —
# it reads this env var once at import time, so setting it any later (e.g. in
# stt/mlx_whisper_engine.py) is a no-op once something earlier in the import
# chain has already pulled huggingface_hub in. Already-downloaded models only.
os.environ.setdefault("HF_HUB_OFFLINE", "1")

import asyncio
import json
import tempfile
import wave
from pathlib import Path
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from agents.emotion.processor import JarvisVoiceProcessor

from .ollama_client import list_models
from .orchestrator import run_orchestrator
from .stt.base import SttEngine
from .stt.deepgram_engine import DeepgramConfigError
from .stt.factory import STTFactory

app = FastAPI(title="jarvis-ver2 orchestrator")

emotion_agent = JarvisVoiceProcessor()

# Second line of defense against Whisper hallucinating fluent-but-unrelated
# stock phrases on marginal audio (see stt/mlx_whisper_engine.py's length
# gate) — these are common Korean YouTube outro/sign-off lines it tends to
# invent for near-silence. Drop a final transcript that's *only* one of these.
_HALLUCINATED_PHRASES = {
    "다음 영상에서 만나요",
    "시청해주셔서 감사합니다",
    "구독과 좋아요 부탁드립니다",
    "그럼 다음 시간에 또 만나요",
    "이 영상이 도움이 되셨다면 구독 부탁드립니다",
}


def _looks_hallucinated(transcript: str) -> bool:
    normalized = transcript.strip().rstrip(".!?~ ")
    return normalized in _HALLUCINATED_PHRASES


def _write_pcm16_wav(path: Path, audio: bytes) -> None:
    with wave.open(str(path), "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(16_000)
        wav_file.writeframes(audio)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/models")
async def models() -> dict[str, list[str]]:
    all_models = await list_models()
    chat_models = [name for name in all_models if "embed" not in name.lower()]
    return {"models": chat_models}


@app.websocket("/ws/runtime")
async def runtime_socket(websocket: WebSocket) -> None:
    await websocket.accept()

    async def send_snapshot(core_state: str, agent: dict[str, Any]) -> None:
        await websocket.send_json({"type": "snapshot", "coreState": core_state, "agent": agent})

    async def send_audio(audio: bytes) -> None:
        await websocket.send_bytes(audio)

    try:
        while True:
            raw = await websocket.receive_text()
            message = json.loads(raw)
            if message.get("type") != "command":
                continue
            text = str(message.get("text", "")).strip()
            if not text:
                continue
            model = message.get("model")
            emotion = str(message.get("emotion", "neutral"))
            # Sequential by construction: the next receive_text() only runs
            # once run_orchestrator finishes, so commands can't overlap.
            await run_orchestrator(text, model, send_snapshot, send_audio, emotion)
    except WebSocketDisconnect:
        return


@app.websocket("/ws/voice")
async def voice_socket(websocket: WebSocket) -> None:
    """
    Streaming STT. First message must be JSON {"type": "start", "mode": "local"|"cloud"},
    picking the STTFactory backend for this session. After that, binary frames are raw
    PCM16LE mono 16kHz audio; {"type": "stop"} flushes the final transcript and ends the
    session. Transcript updates are pushed back as {"type": "transcript", "text", "final"}.
    """
    await websocket.accept()

    raw = await websocket.receive_text()
    start_message = json.loads(raw)
    if start_message.get("type") != "start":
        await websocket.close(code=1002, reason="Expected a 'start' message first")
        return

    mode = start_message.get("mode")
    try:
        engine: SttEngine = STTFactory.create(mode)
    except DeepgramConfigError as exc:
        await websocket.send_json({"type": "error", "message": str(exc)})
        await websocket.close(code=1011)
        return
    except ValueError as exc:
        await websocket.send_json({"type": "error", "message": str(exc)})
        await websocket.close(code=1002)
        return

    final_transcripts: list[str] = []
    audio_buffer = bytearray()

    async def forward_events() -> None:
        async for event in engine.events():
            if event.final:
                if event.text.strip():
                    final_transcripts.append(event.text.strip())
                continue
            try:
                await websocket.send_json({"type": "transcript", "text": event.text, "final": False})
            except WebSocketDisconnect:
                return

    forward_task = asyncio.create_task(forward_events())

    try:
        while True:
            message = await websocket.receive()
            if message.get("type") == "websocket.disconnect":
                raise WebSocketDisconnect
            if message.get("bytes") is not None:
                chunk = message["bytes"]
                audio_buffer.extend(chunk)
                await engine.feed(chunk)
                continue
            if message.get("text") is not None:
                control = json.loads(message["text"])
                if control.get("type") == "stop":
                    with tempfile.TemporaryDirectory(prefix="jarvis-emotion-") as temp_dir:
                        audio_path = Path(temp_dir) / "voice.wav"
                        _write_pcm16_wav(audio_path, bytes(audio_buffer))
                        emotion_task = asyncio.create_task(
                            asyncio.to_thread(emotion_agent.run_emotion_recognition, audio_path)
                        )

                        # Final STT decoding and SER now run at the same time.
                        await engine.finish()
                        await forward_task
                        try:
                            emotion = await asyncio.wait_for(
                                emotion_task,
                                timeout=emotion_agent.emotion_timeout_seconds,
                            )
                        except TimeoutError:
                            emotion_task.cancel()
                            emotion = "neutral"
                        except Exception:  # noqa: BLE001 - neutral is the contract fallback
                            emotion = "neutral"

                    transcript = " ".join(final_transcripts).strip()
                    audio_seconds = len(audio_buffer) / (16_000 * 2)
                    if _looks_hallucinated(transcript):
                        print(f"STT: {audio_seconds:.2f}s audio -> {transcript!r} (dropped: looks hallucinated)")
                        transcript = ""
                    else:
                        print(f"STT: {audio_seconds:.2f}s audio -> {transcript!r} (emotion={emotion})")
                    await websocket.send_json(
                        {"type": "transcript", "text": transcript, "final": True, "emotion": emotion}
                    )
                    break
    except WebSocketDisconnect:
        if not forward_task.done():
            forward_task.cancel()
        return

    await websocket.close()
