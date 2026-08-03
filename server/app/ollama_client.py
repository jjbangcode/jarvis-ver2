from __future__ import annotations

import json
from typing import AsyncIterator

import httpx

OLLAMA_CHAT_URL = "http://localhost:11434/api/chat"
OLLAMA_TAGS_URL = "http://localhost:11434/api/tags"


async def list_models() -> list[str]:
    """Names of locally-pulled Ollama models, e.g. ["qwen2.5:7b-instruct-q4_K_M", ...]."""
    async with httpx.AsyncClient(timeout=5.0) as client:
        response = await client.get(OLLAMA_TAGS_URL)
        response.raise_for_status()
        data = response.json()
        return [model["name"] for model in data.get("models", [])]


async def stream_chat(model: str, system_prompt: str, user_message: str) -> AsyncIterator[str]:
    """Yields response text chunks from a local Ollama /api/chat stream."""
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "stream": True,
    }

    async with httpx.AsyncClient(timeout=None) as client:
        async with client.stream("POST", OLLAMA_CHAT_URL, json=payload) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line:
                    continue
                data = json.loads(line)
                if data.get("done"):
                    break
                content = data.get("message", {}).get("content", "")
                if content:
                    yield content
