"""Send emotion2vec's bundled sample through the running JARVIS voice WebSocket."""

from __future__ import annotations

import asyncio
import json
import wave
from pathlib import Path

import websockets


async def main() -> None:
    samples = list(
        Path.home().glob(
            ".cache/huggingface/hub/models--emotion2vec--emotion2vec_plus_large/"
            "snapshots/*/example/test.wav"
        )
    )
    if not samples:
        raise FileNotFoundError("The cached emotion2vec test.wav was not found")

    with wave.open(str(samples[0]), "rb") as wav_file:
        audio = wav_file.readframes(wav_file.getnframes())

    async with websockets.connect("ws://127.0.0.1:8787/ws/voice") as socket:
        await socket.send(json.dumps({"type": "start", "mode": "local"}))
        await socket.send(audio)
        await socket.send(json.dumps({"type": "stop"}))

        async for raw in socket:
            message = json.loads(raw)
            print(message)
            if message.get("final"):
                break


if __name__ == "__main__":
    asyncio.run(main())
