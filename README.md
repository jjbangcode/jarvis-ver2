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

Later stages (connector overlay + live metrics wiring, real-time store, Whisper voice input, orchestrator
integration, TTS, packaging) are not implemented yet.

## Scripts

```bash
npm install
npm run dev      # http://localhost:5173
npm run lint      # eslint .
npx tsc -b        # type check
npm run build     # type check + production build
npm run preview   # preview the production build
```

## Structure

```
src/
  components/    reusable UI primitives (PanelFrame, ...)
  features/
    dashboard/   shell, top bar, core visualization, footer
    agents/      agent status model, cards, icons, legend, mock fixtures
    voice/       reserved for the voice input feature
  hooks/         reserved for shared hooks
  lib/           framework-agnostic helpers (prng, particle layout, color)
  styles/        design tokens, global reset, chamfered-panel CSS
  types/         shared TypeScript types
```
