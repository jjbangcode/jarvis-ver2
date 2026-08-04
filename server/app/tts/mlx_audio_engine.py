from __future__ import annotations

import os
import subprocess
import time
from pathlib import Path
from typing import AsyncIterator

import httpx

# Defaults match the already-configured local MLX Audio voice-cloning setup
# (see ~/Documents/자비스/.env) — same reference voice, same persistent server,
# so this "just works" against the server already running on this machine.
# Override any of these with env vars for a different reference voice/model.
BASE_URL = os.environ.get("JARVIS_MLX_TTS_URL", "http://127.0.0.1:8877")
MODEL = os.environ.get("JARVIS_MLX_TTS_MODEL", "mlx-community/Qwen3-TTS-12Hz-0.6B-Base-bf16")
REFERENCE_AUDIO = os.environ.get(
    "JARVIS_MLX_VOICE_REFERENCE",
    "/Users/su-younlee/Library/Application Support/JarvisHarness/voices/male_reference.wav",
)
REFERENCE_TEXT = os.environ.get("JARVIS_MLX_VOICE_REFERENCE_TEXT", "나랑 세 번만 만나. 당연히 뒤에 거.")
RUNTIME_PYTHON = os.environ.get(
    "JARVIS_MLX_VOICE_RUNTIME_PYTHON",
    "/Users/su-younlee/Library/Application Support/JarvisHarness/voice-runtime/bin/python",
)

STARTUP_TIMEOUT_S = 15.0
REQUEST_TIMEOUT_S = 60.0


class MlxAudioEngine:
    """Cloned local voice via the persistent MLX Audio server (see ~/Documents/자비스/src/jarvis_harness/adapters/mlx_audio_tts.py for the original)."""

    def __init__(self) -> None:
        if not Path(REFERENCE_AUDIO).is_file():
            raise RuntimeError(f"Reference voice file not found: {REFERENCE_AUDIO}")

    async def _server_ready(self, client: httpx.AsyncClient) -> bool:
        try:
            response = await client.get(f"{BASE_URL}/v1/models", timeout=0.5)
            return response.status_code == 200
        except httpx.HTTPError:
            return False

    async def _ensure_server(self, client: httpx.AsyncClient) -> None:
        if await self._server_ready(client):
            return
        if not Path(RUNTIME_PYTHON).is_file():
            raise RuntimeError(
                f"MLX Audio server isn't running and its runtime python wasn't found at {RUNTIME_PYTHON}. "
                "Start it manually: <that python> -m mlx_audio.server --host 127.0.0.1 --port 8877"
            )
        port = BASE_URL.rsplit(":", 1)[-1]
        subprocess.Popen(
            [RUNTIME_PYTHON, "-m", "mlx_audio.server", "--host", "127.0.0.1", "--port", port],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True,
        )
        deadline = time.monotonic() + STARTUP_TIMEOUT_S
        while time.monotonic() < deadline:
            if await self._server_ready(client):
                return
            time.sleep(0.2)
        raise RuntimeError("MLX Audio server failed to start in time")

    async def synthesize(self, text: str) -> bytes:
        async with httpx.AsyncClient() as client:
            await self._ensure_server(client)
            response = await client.post(
                f"{BASE_URL}/v1/audio/speech",
                json={
                    "model": MODEL,
                    "input": text,
                    "lang_code": "Korean",
                    "ref_audio": REFERENCE_AUDIO,
                    "ref_text": REFERENCE_TEXT,
                    "response_format": "wav",
                },
                timeout=REQUEST_TIMEOUT_S,
            )
            response.raise_for_status()
            audio = response.content
            if not audio.startswith(b"RIFF"):
                raise RuntimeError("MLX Audio server did not return a valid WAV")
            return audio

    async def synthesize_stream(self, text: str) -> AsyncIterator[bytes]:
        """
        Same voice, but yields audio as the server generates it (`stream: true`)
        instead of waiting for the whole reply — first audio lands in under a
        second instead of after the full ~6-7s synthesis. Each yielded chunk is
        its own complete, independently-playable WAV file (verified against this
        server: every chunk starts with its own "RIFF...WAVE" header).
        """
        async with httpx.AsyncClient() as client:
            await self._ensure_server(client)
            async with client.stream(
                "POST",
                f"{BASE_URL}/v1/audio/speech",
                json={
                    "model": MODEL,
                    "input": text,
                    "lang_code": "Korean",
                    "ref_audio": REFERENCE_AUDIO,
                    "ref_text": REFERENCE_TEXT,
                    "response_format": "wav",
                    "stream": True,
                    "streaming_interval": 1.0,
                },
                timeout=REQUEST_TIMEOUT_S,
            ) as response:
                response.raise_for_status()
                async for chunk in response.aiter_bytes():
                    if chunk.startswith(b"RIFF"):
                        yield chunk
