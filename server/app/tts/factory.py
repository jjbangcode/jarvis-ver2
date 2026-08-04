from __future__ import annotations

from typing import Literal

from .base import TtsEngine
from .mlx_audio_engine import MlxAudioEngine

TtsMode = Literal["local"]


class TTSFactory:
    """Picks the TTS backend. Only 'local' (cloned voice via MLX Audio) exists so far —
    a 'cloud' engine can be added the same way STTFactory splits local/cloud."""

    @staticmethod
    def create(mode: TtsMode = "local") -> TtsEngine:
        if mode == "local":
            return MlxAudioEngine()
        raise ValueError(f"Unknown TTS mode: {mode!r}")
