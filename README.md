# jarvis-ver2

JARVIS multi-agent HUD dashboard, built step by step (S0–S10). React + TypeScript (strict) + Vite.

## Status

- S0 — project foundation (Vite + React + TS, ESLint, `@/*` alias, feature folders)
- S1 — HUD design tokens, chamfered panels, 3-column static layout
- S2 — central `JarvisCore` canvas visualization: state-colored particle sphere, 4 always-visible concentric
  rings rotating at independent speeds/directions, outer tick-mark/arc-segment/dotted-orbit dial, dynamic pulse
  while speaking
- S3 — agent cards and status: `AgentStatus`/`AgentRun` model, `AgentCard` (status badge, activity line, up to
  3 log lines, progress bar/indeterminate animation, hexagonal SVG icon frame, Core-facing connection port),
  `StatusLegend`, dev-only mock-data preview toggle (default / all-statuses / stress-test fixtures)
- S4 — connector overlay + live metrics wiring: `ConnectorOverlay` SVG spokes from each agent card's port to
  the core edge, status-colored, with an animated flow-dash pulse for running/loading agents; `SystemStatusPanel`
  and `SystemMetricsPanel` wired to mock fixtures (still no backend)
- S5 — real-time store: `RuntimeStoreProvider`/`useRuntimeStore` (React Context) centralize `coreState` +
  `agents`, replacing prop-drilled dev toggles. A scripted keyframe timeline (`runtimeTimeline.ts`,
  `runtimeSimulation.ts`) ticks a full mock pipeline run — dispatch, parallel retrieval, a validation failure
  and retry, completion — end to end every ~24s, with interpolated progress, so the whole HUD reads as live
  without a backend. `RuntimeScenarioDev` can still pin the "all statuses"/"stress test" edge-case fixtures.
- S6 (partial) — orchestrator integration for the Orchestrator agent only: a local `server/` FastAPI backend
  streams real Ollama responses over a WebSocket (`/ws/runtime`). `CommandInput` (replacing `StatusLegend` in
  the right column) sends the typed command + a picked local model; the Orchestrator card and `coreState`
  are driven live by the backend while a run is in flight, then hand back to the mock timeline. The other six
  agent cards are still mock — they need real search/rerank tools that don't exist yet.
- S6.5 — voice in/out for the Orchestrator: `server/app/stt/` (`STTFactory`) and `server/app/tts/`
  (`TTSFactory`) pick a backend per session. STT is `local` (MLX Audio's Whisper endpoint, Apple GPU) or
  `cloud` (Deepgram real-time streaming, needs `DEEPGRAM_API_KEY`); the frontend's `VoiceControls` (in
  `CommandInput`) captures the mic, streams PCM16 over `/ws/voice`, and auto-submits the final transcript.
  TTS is a cloned local voice served by the same MLX Audio server (`~/Documents/자비스`'s existing
  voice-cloning setup, reused as-is) — `run_orchestrator` synthesizes the final response and pushes it as a
  binary WAV frame over `/ws/runtime`, which `useOrchestratorConnection` plays back directly.
- S7 — first modular agent: `server/agents/emotion/` runs the existing STT final decoding and
  `emotion2vec` speech-emotion recognition in parallel, falls back to `neutral`, and injects the result into
  the Qwen2.5 system prompt. The dashboard's `EMOTION TEST` window can test STT + SER without dispatching a
  command to JARVIS at `/emotion-test.html`.

Later stages (extending real integration to the other agents, packaging) are not implemented yet.

## Scripts

```bash
npm install
npm run dev      # http://localhost:5173
npm run lint      # eslint .
npx tsc -b        # type check
npm run build     # type check + production build
npm run preview   # preview the production build
```

Orchestrator backend (optional — CommandInput works without it, it just won't get a real response):

```bash
cd server
python3 -m venv .venv && ./.venv/bin/pip install -r requirements.txt
ollama serve &                          # local Ollama daemon, if not already running
./.venv/bin/uvicorn app.main:app --port 8787
```

Voice (optional — text commands work without it):

- Local STT (`MlxWhisperEngine`) runs `mlx-whisper` in-process (Apple GPU) — no extra server needed.
  Override the model with `JARVIS_WHISPER_MODEL` (default `mlx-community/whisper-large-v3-turbo`).
  (Deliberately *not* the mlx_audio.server `/v1/audio/transcriptions` route — that route crashes the whole
  server process on this machine with an MLX GPU-stream threading error.)
- Local TTS (`MlxAudioEngine`) needs the MLX Audio server running
  (`python -m mlx_audio.server --host 127.0.0.1 --port 8877`) for the cloned voice; defaults to that address
  and to this machine's existing reference file. Override with `JARVIS_MLX_TTS_URL`, `JARVIS_MLX_TTS_MODEL`,
  `JARVIS_MLX_VOICE_REFERENCE`, `JARVIS_MLX_VOICE_REFERENCE_TEXT` env vars for a different setup.
- Cloud STT (Deepgram) needs `DEEPGRAM_API_KEY` set before starting uvicorn.

Emotion agent (optional — voice input falls back to `neutral` until installed):

```bash
cd server
./.venv/bin/pip install -r agents/emotion/requirements.txt
./.venv/bin/python -m unittest discover -s agents/emotion/tests -v
```

Start the frontend and backend, then open `http://localhost:5173/emotion-test.html` to see the final transcript
and detected emotion without sending the transcript to Ollama.

## Structure

```
src/
  components/    reusable UI primitives (PanelFrame, ...)
  features/
    dashboard/   shell, top bar, core visualization, connector overlay, command input, footer
    agents/      agent status model, cards, icons, mock fixtures
    voice/       mic capture (useVoiceInput), VoiceControls (local/cloud toggle + mic button)
  hooks/         reserved for shared hooks
  lib/           framework-agnostic helpers (prng, particle layout, color)
  store/         RuntimeStoreProvider/useRuntimeStore — the central coreState + agents store,
                 plus useOrchestratorConnection (the WebSocket link to server/)
  styles/        design tokens, global reset, chamfered-panel CSS
  types/         shared TypeScript types

server/          FastAPI + Ollama orchestrator backend (Python, separate from the Vite app)
  agents/emotion/ first independent agent — parallel STT/SER, dynamic prompt, tests
  app/stt/       STTFactory — local (MLX Whisper) / cloud (Deepgram) speech-to-text engines
  app/tts/       TTSFactory — local cloned-voice text-to-speech via MLX Audio
```
