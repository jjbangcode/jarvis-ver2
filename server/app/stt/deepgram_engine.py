from __future__ import annotations

import asyncio
import json
import os
from typing import AsyncIterator

import websockets

from .base import TranscriptEvent

DEEPGRAM_WS_URL = (
    "wss://api.deepgram.com/v1/listen"
    "?encoding=linear16&sample_rate=16000&channels=1"
    "&interim_results=true&punctuate=true&endpointing=300"
)


class DeepgramConfigError(RuntimeError):
    """Raised when DEEPGRAM_API_KEY is missing so the caller can surface a clear error."""


class DeepgramEngine:
    """Real-time cloud STT via Deepgram's streaming websocket API."""

    def __init__(self) -> None:
        api_key = os.environ.get("DEEPGRAM_API_KEY")
        if not api_key:
            raise DeepgramConfigError("DEEPGRAM_API_KEY is not set")

        self._api_key = api_key
        self._audio_queue: asyncio.Queue[bytes | None] = asyncio.Queue()
        self._events_queue: asyncio.Queue[TranscriptEvent | None] = asyncio.Queue()
        self._task = asyncio.create_task(self._run())

    async def feed(self, chunk: bytes) -> None:
        await self._audio_queue.put(chunk)

    async def _run(self) -> None:
        try:
            async with websockets.connect(
                DEEPGRAM_WS_URL,
                additional_headers={"Authorization": f"Token {self._api_key}"},
            ) as socket:

                async def sender() -> None:
                    while True:
                        chunk = await self._audio_queue.get()
                        if chunk is None:
                            await socket.send(json.dumps({"type": "CloseStream"}))
                            return
                        await socket.send(chunk)

                async def receiver() -> None:
                    async for raw in socket:
                        try:
                            message = json.loads(raw)
                        except (TypeError, ValueError):
                            continue
                        alternatives = message.get("channel", {}).get("alternatives", [])
                        transcript = alternatives[0].get("transcript", "") if alternatives else ""
                        if not transcript:
                            continue
                        is_final = bool(message.get("is_final") or message.get("speech_final"))
                        await self._events_queue.put(TranscriptEvent(text=transcript, final=is_final))

                sender_task = asyncio.create_task(sender())
                await receiver()
                await sender_task
        except asyncio.CancelledError:
            pass
        except Exception as exc:  # noqa: BLE001 — surface connection/protocol failures to the client
            await self._events_queue.put(TranscriptEvent(text=f"[deepgram error] {exc}", final=True))
        finally:
            await self._events_queue.put(None)

    async def events(self) -> AsyncIterator[TranscriptEvent]:
        while True:
            event = await self._events_queue.get()
            if event is None:
                return
            yield event

    async def finish(self) -> None:
        await self._audio_queue.put(None)
        await self._task
