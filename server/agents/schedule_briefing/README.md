# Schedule Briefing Agent

이 Mac의 Apple 캘린더를 EventKit으로 읽어 하루 일정을 로컬에서 브리핑하는 독립 에이전트입니다.
JARVIS 대시보드나 오케스트레이터에는 연결되지 않습니다.

## 최초 빌드 및 실행

```bash
cd server
chmod +x agents/schedule_briefing/build_bridge.sh
agents/schedule_briefing/build_bridge.sh
open "agents/schedule_briefing/bin/JARVIS Schedule Briefing.app"
./.venv/bin/python -m agents.schedule_briefing.agent
```

앱을 처음 열면 macOS가 캘린더 접근 권한을 묻습니다. `전체 접근 허용`을 선택하세요.
허용하지 않았다면 시스템 설정 > 개인정보 보호 및 보안 >
캘린더에서 `JARVIS Schedule Briefing`의 접근을 허용한 뒤 다시 실행하세요.

현재 권한이 거부된 경우 에이전트는 Python 예외 추적을 노출하지 않고 권한 설정 경로를 안내합니다.

다른 날짜 또는 원본 JSON을 확인할 수도 있습니다.

```bash
./.venv/bin/python -m agents.schedule_briefing.agent --date 2026-08-04
./.venv/bin/python -m agents.schedule_briefing.agent --json
```

## 테스트

```bash
./.venv/bin/python -m unittest discover -s agents/schedule_briefing/tests -v
```

## 독립 테스트 UI

```bash
cd server
./.venv/bin/uvicorn agents.schedule_briefing.web:app --host 127.0.0.1 --port 8790
```

브라우저에서 `http://127.0.0.1:8790`을 열고 마이크 버튼을 누른 뒤
`자비스, 오늘 일정 브리핑 해줘`라고 말하세요. 버튼을 다시 누르면 로컬 STT가 명령을 인식하고,
Apple Calendar 브리핑을 텍스트로 표시한 뒤 같은 내용을 로컬 TTS WAV 음성으로 재생합니다.
이 UI와 API는 JARVIS 대시보드나 오케스트레이터에 연결되지 않습니다.
