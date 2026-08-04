from __future__ import annotations

from typing import Literal

from .base import SttEngine
from .deepgram_engine import DeepgramEngine
from .mlx_whisper_engine import MlxWhisperEngine

SttMode = Literal["local", "cloud"]


class STTFactory:
    """Picks the STT backend per session: 'local' (MLX Whisper, offline, Apple GPU) or 'cloud' (Deepgram, real-time)."""

    @staticmethod
    def create(mode: SttMode) -> SttEngine:
        if mode == "local":
            return MlxWhisperEngine()
        if mode == "cloud":
            return DeepgramEngine()
        raise ValueError(f"Unknown STT mode: {mode!r}")
