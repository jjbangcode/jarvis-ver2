from __future__ import annotations

import json
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .ollama_client import list_models
from .orchestrator import run_orchestrator

app = FastAPI(title="jarvis-ver2 orchestrator")

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
    return {"models": await list_models()}


@app.websocket("/ws/runtime")
async def runtime_socket(websocket: WebSocket) -> None:
    await websocket.accept()

    async def send_snapshot(core_state: str, agent: dict[str, Any]) -> None:
        await websocket.send_json({"type": "snapshot", "coreState": core_state, "agent": agent})

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
            # Sequential by construction: the next receive_text() only runs
            # once run_orchestrator finishes, so commands can't overlap.
            await run_orchestrator(text, model, send_snapshot)
    except WebSocketDisconnect:
        return
