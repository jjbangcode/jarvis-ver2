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

Later stages (Whisper voice input, extending real integration to the other agents, TTS, packaging) are not
implemented yet.

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

## Structure

```
src/
  components/    reusable UI primitives (PanelFrame, ...)
  features/
    dashboard/   shell, top bar, core visualization, connector overlay, command input, footer
    agents/      agent status model, cards, icons, mock fixtures
    voice/       reserved for the voice input feature
  hooks/         reserved for shared hooks
  lib/           framework-agnostic helpers (prng, particle layout, color)
  store/         RuntimeStoreProvider/useRuntimeStore — the central coreState + agents store,
                 plus useOrchestratorConnection (the WebSocket link to server/)
  styles/        design tokens, global reset, chamfered-panel CSS
  types/         shared TypeScript types

server/          FastAPI + Ollama orchestrator backend (Python, separate from the Vite app)
```
