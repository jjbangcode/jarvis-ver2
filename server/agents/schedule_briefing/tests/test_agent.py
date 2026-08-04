from __future__ import annotations

import unittest
from datetime import date, datetime
from zoneinfo import ZoneInfo

from agents.schedule_briefing.agent import CalendarEvent, ScheduleBriefingAgent

SEOUL = ZoneInfo("Asia/Seoul")
TARGET_DATE = date(2026, 8, 4)


class FakeCalendarSource:
    def __init__(self, events: list[CalendarEvent]) -> None:
        self.events = events

    def events_for_day(self, target_date: date) -> list[CalendarEvent]:
        self.requested_date = target_date
        return self.events


def event(title: str, start_hour: int, end_hour: int, *, all_day: bool = False, location: str | None = None) -> CalendarEvent:
    return CalendarEvent(
        id=title,
        title=title,
        start=datetime(2026, 8, 4, start_hour, tzinfo=SEOUL),
        end=datetime(2026, 8, 4, end_hour, tzinfo=SEOUL),
        all_day=all_day,
        calendar="테스트",
        location=location,
    )


class ScheduleBriefingAgentTests(unittest.TestCase):
    def test_empty_day(self) -> None:
        briefing = ScheduleBriefingAgent(FakeCalendarSource([])).brief(TARGET_DATE)
        self.assertIn("등록된 일정이 없습니다", briefing)

    def test_orders_and_formats_events(self) -> None:
        source = FakeCalendarSource(
            [event("회의", 14, 15, location="회의실 A"), event("휴가", 0, 23, all_day=True), event("운동", 9, 10)]
        )
        briefing = ScheduleBriefingAgent(source).brief(TARGET_DATE)
        self.assertIn("총 3개", briefing)
        self.assertLess(briefing.index("종일, 휴가"), briefing.index("09:00–10:00, 운동"))
        self.assertIn("14:00–15:00, 회의, 장소는 회의실 A", briefing)

    def test_warns_about_overlaps(self) -> None:
        source = FakeCalendarSource([event("집중 업무", 9, 11), event("팀 회의", 10, 12)])
        briefing = ScheduleBriefingAgent(source).brief(TARGET_DATE)
        self.assertIn("시간이 겹치는 일정", briefing)
        self.assertIn("집중 업무 / 팀 회의", briefing)


if __name__ == "__main__":
    unittest.main()
