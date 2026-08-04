from __future__ import annotations

import asyncio
import json
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse

from app.stt.factory import STTFactory
from app.tts.factory import TTSFactory

from .agent import AppleCalendarSource, CalendarBridgeError, CalendarEvent, CalendarSource, ScheduleBriefingAgent

STATIC_DIR = Path(__file__).resolve().parent / "static"

app = FastAPI(title="Schedule Briefing Test UI", docs_url=None, redoc_url=None)

SCHEDULE_KEYWORDS = ("일정", "스케줄", "캘린더")
BRIEFING_KEYWORDS = ("브리핑", "알려", "말해", "읽어", "뭐")


def event_payload(event: CalendarEvent) -> dict[str, Any]:
    return {
        "id": event.id,
        "title": event.title,
        "start": event.start.isoformat(),
        "end": event.end.isoformat(),
        "allDay": event.all_day,
        "calendar": event.calendar,
        "location": event.location,
    }


class SnapshotSource:
    def __init__(self, events: list[CalendarEvent]) -> None:
        self.events = events

    def events_for_day(self, target_date: date) -> list[CalendarEvent]:
        return self.events


def briefing_payload(target_date: date, source: CalendarSource | None = None) -> dict[str, Any]:
    calendar_source = source or AppleCalendarSource()
    events = list(calendar_source.events_for_day(target_date))
    agent = ScheduleBriefingAgent(SnapshotSource(events))
    overlaps = agent._find_overlaps(events)
    overlap_ids = {event.id for pair in overlaps for event in pair}
    return {
        "date": target_date.isoformat(),
        "briefing": agent.brief(target_date),
        "eventCount": len(events),
        "events": [{**event_payload(event), "overlap": event.id in overlap_ids} for event in events],
        "overlaps": [{"first": first.id, "second": second.id} for first, second in overlaps],
    }


def requested_briefing_date(transcript: str, today: date | None = None) -> date | None:
    normalized = "".join(transcript.lower().split())
    if not any(keyword in normalized for keyword in SCHEDULE_KEYWORDS):
        return None
    if not any(keyword in normalized for keyword in BRIEFING_KEYWORDS):
        return None

    base_date = today or datetime.now().astimezone().date()
    if "모레" in normalized:
        return base_date + timedelta(days=2)
    if "내일" in normalized:
        return base_date + timedelta(days=1)
    return base_date


async def transcribe_engine(engine: Any) -> str:
    transcripts: list[str] = []
    async for event in engine.events():
        if event.final and event.text.strip():
            transcripts.append(event.text.strip())
    return " ".join(transcripts).strip()


@app.get("/", include_in_schema=False)
def index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/api/briefing")
async def get_briefing(target: date | None = Query(default=None, alias="date")) -> dict[str, Any]:
    target_date = target or datetime.now().astimezone().date()
    try:
        return await run_in_threadpool(briefing_payload, target_date)
    except CalendarBridgeError as exc:
        raise HTTPException(
            status_code=503,
            detail={
                "code": exc.code,
                "message": str(exc),
                "hint": "시스템 설정 > 개인정보 보호 및 보안 > 캘린더에서 JARVIS Schedule Briefing의 전체 접근을 허용해 주세요.",
            },
        ) from exc


@app.websocket("/ws/voice-briefing")
async def voice_briefing_socket(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        start = json.loads(await websocket.receive_text())
        if start.get("type") != "start":
            await websocket.send_json({"type": "error", "message": "음성 녹음을 시작하지 못했습니다."})
            await websocket.close(code=1002)
            return

        engine = STTFactory.create("local")
        transcript_task = asyncio.create_task(transcribe_engine(engine))
        while True:
            message = await websocket.receive()
            if message.get("type") == "websocket.disconnect":
                raise WebSocketDisconnect
            if message.get("bytes") is not None:
                await engine.feed(message["bytes"])
                continue
            if message.get("text") is None:
                continue
            control = json.loads(message["text"])
            if control.get("type") == "stop":
                break

        await websocket.send_json({"type": "status", "phase": "transcribing", "message": "음성을 텍스트로 바꾸고 있습니다."})
        await engine.finish()
        transcript = await transcript_task
        await websocket.send_json({"type": "transcript", "text": transcript})

        target_date = requested_briefing_date(transcript)
        if target_date is None:
            await websocket.send_json(
                {
                    "type": "error",
                    "message": "일정 브리핑 요청을 인식하지 못했습니다. ‘자비스, 오늘 일정 브리핑 해줘’라고 말해 주세요.",
                }
            )
            return

        await websocket.send_json({"type": "status", "phase": "calendar", "message": "Apple Calendar에서 일정을 확인하고 있습니다."})
        try:
            payload = await run_in_threadpool(briefing_payload, target_date)
        except CalendarBridgeError as exc:
            await websocket.send_json(
                {
                    "type": "error",
                    "message": str(exc),
                    "hint": "시스템 설정 > 개인정보 보호 및 보안 > 캘린더에서 JARVIS Schedule Briefing의 전체 접근을 허용해 주세요.",
                }
            )
            return

        await websocket.send_json({"type": "briefing", **payload})
        await websocket.send_json({"type": "status", "phase": "speaking", "message": "브리핑 음성을 만들고 있습니다."})
        try:
            audio = await TTSFactory.create().synthesize(payload["briefing"])
        except Exception as exc:  # noqa: BLE001 - UI receives a readable local runtime error
            await websocket.send_json({"type": "error", "message": f"음성 합성에 실패했습니다: {exc}"})
            return
        await websocket.send_json({"type": "audio", "format": "audio/wav", "bytes": len(audio)})
        await websocket.send_bytes(audio)
        await websocket.send_json({"type": "done"})
    except WebSocketDisconnect:
        return
    except Exception as exc:  # noqa: BLE001 - keep the test socket alive long enough to report failures
        await websocket.send_json({"type": "error", "message": str(exc)})
    finally:
        try:
            await websocket.close()
        except RuntimeError:
            pass


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8790)
