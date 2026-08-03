from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any, Awaitable, Callable

from .ollama_client import stream_chat

Send = Callable[[str, dict[str, Any]], Awaitable[None]]

ORCHESTRATOR_ID = "orchestrator"
ORCHESTRATOR_NUMBER = 1
ORCHESTRATOR_NAME = "Orchestrator"

DEFAULT_MODEL = "qwen2.5:7b-instruct-q4_K_M"
SYSTEM_PROMPT = "You are JARVIS, a concise multi-agent orchestrator assistant. Answer the user's request directly and briefly."

STREAM_PUSH_INTERVAL_S = 0.3


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


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


async def run_orchestrator(command: str, model: str | None, send: Send) -> None:
    """
    Drives the Orchestrator agent card + core state for one real command,
    end to end: a real Ollama call, streamed back as it generates. The other
    six agent cards keep running the frontend's local mock timeline — no
    real search/rerank tools exist yet for those.
    """
    model = model or DEFAULT_MODEL
    started_at = _now()
    logs = [f"Received command: {command[:120]}", f"Model: {model}"]

    await send("listening", _agent("running", "Received command", logs, started_at=started_at))
    await send("processing", _agent("running", "Generating response", logs, started_at=started_at))

    accumulated = ""
    loop = asyncio.get_event_loop()
    last_push = loop.time()

    try:
        async for chunk in stream_chat(model, SYSTEM_PROMPT, command):
            accumulated += chunk
            now = loop.time()
            if now - last_push >= STREAM_PUSH_INTERVAL_S:
                last_push = now
                await send(
                    "processing",
                    _agent("running", "Generating response", logs + [accumulated], started_at=started_at),
                )
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
    await send("speaking", final_agent)
    await asyncio.sleep(2.5)
    await send("idle", final_agent)
