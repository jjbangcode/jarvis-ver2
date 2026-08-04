from __future__ import annotations

from dataclasses import dataclass
from typing import AsyncIterator, Protocol


@dataclass(frozen=True)
class TranscriptEvent:
    text: str
    final: bool


class SttEngine(Protocol):
    """
    One STT backend. `feed` pushes a raw PCM16LE mono 16kHz audio chunk in;
    `events` yields transcript updates out — interim (final=False) as they
    become available, then a last final=True event once `finish` is called
    and any trailing audio has been flushed.
    """

    async def feed(self, chunk: bytes) -> None: ...

    def events(self) -> AsyncIterator[TranscriptEvent]: ...

    async def finish(self) -> None: ...
