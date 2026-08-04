from __future__ import annotations

import unittest
from datetime import date, datetime
from zoneinfo import ZoneInfo

from agents.schedule_briefing.agent import CalendarEvent
from agents.schedule_briefing.web import briefing_payload, requested_briefing_date

SEOUL = ZoneInfo("Asia/Seoul")


class FakeSource:
    def events_for_day(self, target_date: date) -> list[CalendarEvent]:
        return [
            CalendarEvent(
                id="meeting",
                title="테스트 회의",
                start=datetime(2026, 8, 4, 10, tzinfo=SEOUL),
                end=datetime(2026, 8, 4, 11, tzinfo=SEOUL),
                all_day=False,
                calendar="업무",
                location="회의실 A",
            )
        ]


class BriefingPayloadTests(unittest.TestCase):
    def test_returns_structured_event_data(self) -> None:
        payload = briefing_payload(date(2026, 8, 4), FakeSource())
        self.assertEqual(payload["eventCount"], 1)
        self.assertEqual(payload["events"][0]["title"], "테스트 회의")
        self.assertIn("총 1개", payload["briefing"])

    def test_understands_today_briefing_voice_command(self) -> None:
        today = date(2026, 8, 3)
        self.assertEqual(requested_briefing_date("자비스 오늘 일정 브리핑 해줘", today), today)

    def test_understands_tomorrow_briefing_voice_command(self) -> None:
        today = date(2026, 8, 3)
        self.assertEqual(requested_briefing_date("내일 스케줄 좀 알려줘", today), date(2026, 8, 4))

    def test_rejects_unrelated_voice_command(self) -> None:
        self.assertIsNone(requested_briefing_date("자비스 음악 틀어줘", date(2026, 8, 3)))


if __name__ == "__main__":
    unittest.main()
