from __future__ import annotations

import argparse
import json
import subprocess
import sys
from dataclasses import dataclass
from datetime import date, datetime, time
from pathlib import Path
from typing import Callable, Protocol, Sequence
from zoneinfo import ZoneInfo

SEOUL = ZoneInfo("Asia/Seoul")
DEFAULT_BRIDGE = (
    Path(__file__).resolve().parent
    / "bin"
    / "JARVIS Schedule Briefing.app"
    / "Contents"
    / "MacOS"
    / "calendar_bridge"
)


class CalendarBridgeError(RuntimeError):
    """The local EventKit bridge could not return calendar data."""

    def __init__(self, message: str, *, code: str = "calendar_bridge_error") -> None:
        super().__init__(message)
        self.code = code


@dataclass(frozen=True)
class CalendarEvent:
    id: str
    title: str
    start: datetime
    end: datetime
    all_day: bool
    calendar: str
    location: str | None = None

    @classmethod
    def from_payload(cls, payload: dict[str, object]) -> CalendarEvent:
        return cls(
            id=str(payload["id"]),
            title=str(payload["title"]),
            start=datetime.fromisoformat(str(payload["start"]).replace("Z", "+00:00")),
            end=datetime.fromisoformat(str(payload["end"]).replace("Z", "+00:00")),
            all_day=bool(payload["allDay"]),
            calendar=str(payload["calendar"]),
            location=str(payload["location"]) if payload.get("location") else None,
        )


class CalendarSource(Protocol):
    def events_for_day(self, target_date: date) -> Sequence[CalendarEvent]: ...


class AppleCalendarSource:
    def __init__(self, bridge_path: Path = DEFAULT_BRIDGE, timezone: ZoneInfo = SEOUL, timeout_seconds: float = 30) -> None:
        self.bridge_path = bridge_path
        self.timezone = timezone
        self.timeout_seconds = timeout_seconds

    def events_for_day(self, target_date: date) -> list[CalendarEvent]:
        if not self.bridge_path.is_file():
            raise CalendarBridgeError(
                f"Calendar bridge is not built: {self.bridge_path}. Run agents/schedule_briefing/build_bridge.sh"
            )

        start = datetime.combine(target_date, time.min, self.timezone)
        end = datetime.combine(target_date, time.max, self.timezone)
        try:
            completed = subprocess.run(
                [str(self.bridge_path), str(start.timestamp()), str(end.timestamp())],
                capture_output=True,
                text=True,
                timeout=self.timeout_seconds,
                check=False,
            )
        except subprocess.TimeoutExpired as exc:
            raise CalendarBridgeError("Apple Calendar request timed out") from exc

        output = completed.stdout.strip()
        try:
            payload = json.loads(output)
        except json.JSONDecodeError as exc:
            detail = completed.stderr.strip() or output or "No output"
            raise CalendarBridgeError(f"Invalid Calendar bridge response: {detail}") from exc

        if completed.returncode != 0 or "error" in payload:
            raise CalendarBridgeError(
                str(payload.get("error", "Apple Calendar request failed")),
                code=str(payload.get("code", "calendar_request_failed")),
            )

        events = [CalendarEvent.from_payload(item) for item in payload.get("events", [])]
        return sorted(events, key=lambda item: (not item.all_day, item.start))


class ScheduleBriefingAgent:
    def __init__(
        self,
        source: CalendarSource | None = None,
        *,
        timezone: ZoneInfo = SEOUL,
        now_provider: Callable[[], datetime] | None = None,
    ) -> None:
        self.source = source or AppleCalendarSource(timezone=timezone)
        self.timezone = timezone
        self.now_provider = now_provider or (lambda: datetime.now(timezone))

    def brief(self, target_date: date | None = None) -> str:
        target_date = target_date or self.now_provider().date()
        events = list(self.source.events_for_day(target_date))
        date_label = target_date.strftime("%Y년 %m월 %d일")
        if not events:
            return f"{date_label} 일정 브리핑입니다. 등록된 일정이 없습니다."

        lines = [f"{date_label} 일정은 총 {len(events)}개입니다."]
        for event in events:
            if event.all_day:
                timing = "종일"
            else:
                local_start = event.start.astimezone(self.timezone)
                local_end = event.end.astimezone(self.timezone)
                timing = f"{local_start:%H:%M}–{local_end:%H:%M}"
            location = f", 장소는 {event.location}" if event.location else ""
            lines.append(f"{timing}, {event.title}{location}.")

        overlaps = self._find_overlaps(events)
        if overlaps:
            names = ", ".join(f"{first.title} / {second.title}" for first, second in overlaps)
            lines.append(f"시간이 겹치는 일정이 있습니다: {names}.")
        return "\n".join(lines)

    @staticmethod
    def _find_overlaps(events: Sequence[CalendarEvent]) -> list[tuple[CalendarEvent, CalendarEvent]]:
        timed = sorted((event for event in events if not event.all_day), key=lambda event: event.start)
        overlaps: list[tuple[CalendarEvent, CalendarEvent]] = []
        for index, current in enumerate(timed):
            for following in timed[index + 1 :]:
                if following.start >= current.end:
                    break
                overlaps.append((current, following))
        return overlaps


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a local briefing from Apple Calendar")
    parser.add_argument("--date", help="Briefing date in YYYY-MM-DD; defaults to today")
    parser.add_argument("--json", action="store_true", help="Print raw calendar events as JSON")
    args = parser.parse_args()

    target_date = date.fromisoformat(args.date) if args.date else datetime.now(SEOUL).date()
    source = AppleCalendarSource()
    try:
        if args.json:
            events = source.events_for_day(target_date)
            print(
                json.dumps(
                    [
                        {
                            "id": event.id,
                            "title": event.title,
                            "start": event.start.isoformat(),
                            "end": event.end.isoformat(),
                            "allDay": event.all_day,
                            "calendar": event.calendar,
                            "location": event.location,
                        }
                        for event in events
                    ],
                    ensure_ascii=False,
                    indent=2,
                )
            )
            return
        print(ScheduleBriefingAgent(source).brief(target_date))
    except CalendarBridgeError as exc:
        print(f"일정 브리핑을 만들 수 없습니다: {exc}", file=sys.stderr)
        if exc.code == "permission_denied":
            print(
                "시스템 설정 > 개인정보 보호 및 보안 > 캘린더에서 접근을 허용한 뒤 다시 실행해 주세요.",
                file=sys.stderr,
            )
        raise SystemExit(2) from exc


if __name__ == "__main__":
    main()
