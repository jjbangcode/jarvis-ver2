from __future__ import annotations

from typing import AsyncIterator, Protocol


class TtsEngine(Protocol):
    """One TTS backend. `synthesize` returns WAV bytes for the given text."""

    async def synthesize(self, text: str) -> bytes: ...

    def synthesize_stream(self, text: str) -> AsyncIterator[bytes]: ...
